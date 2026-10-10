-- Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
--
-- WSO2 LLC. licenses this file to you under the Apache License,
-- Version 2.0 (the "License"); you may not use this file except
-- in compliance with the License.
-- You may obtain a copy of the License at
--
-- http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License.

-- NOTE FOR REVIEW: work_item_attachment is mirrored from, and owned by,
-- operations/csm-sync-service (see 0085_work_item_attachment_table.sql's own
-- comment). The columns this migration adds must also be added to that
-- repo's copy of the same table, under this exact filename, by someone with
-- access to it -- this repo cannot verify sync-service's current migration
-- numbering or land a change there. Do not apply this in any shared
-- environment until that counterpart migration exists.

BEGIN;

-- Retiring case_attachment: entity-service's own Postgres-backed attachment
-- upload flow (plain-Postgres CSM-native uploads and the
-- postgres-servicenow-dual-write ServiceNow-first mirror) moves onto this
-- table instead of its own case_attachment table. work_item_attachment
-- already carries everything a pure sync-job row needs (name, content_type,
-- size_bytes, state, ...) PLUS the free-text created_by/updated_by this
-- write path reuses directly for its own uploader/updater (storing their
-- email, same convention comment.created_by and a sync-job row's own
-- created_by already use -- see case_repo.go's CreateCaseAttachment doc
-- comment for why there is deliberately no separate uploaded_by FK column).
-- These three columns are what entity-service's own write path additionally
-- needs, the same three case_attachment had beyond work_item_attachment's
-- existing shape.
--
-- All three are nullable: a row this process did NOT create (a pure
-- sync-job/ServiceNow-synced row) has none of them. status IS NOT NULL is
-- therefore the discriminator the Go code uses to tell its own rows apart
-- from sync-only rows sharing the same table -- see case_repo.go's own
-- comment on the queries that rely on it.
ALTER TABLE work_item_attachment
  ADD COLUMN IF NOT EXISTS storage_key TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'complete'));

CREATE INDEX IF NOT EXISTS idx_work_item_attachment_status_created ON work_item_attachment(status, created_on);

-- Composite index for the paginated per-work-item feed (most recent first) --
-- mirrors idx_case_attachment_case_created (migration 0106). The existing
-- idx_work_item_attachment_work_item_id (migration 0085) is a single-column
-- index and does not serve an ORDER BY created_on DESC efficiently on its own.
CREATE INDEX IF NOT EXISTS idx_work_item_attachment_work_item_created ON work_item_attachment(work_item_id, created_on DESC);

-- Backfill: every existing case_attachment row gets an equivalent
-- work_item_attachment row under the SAME id, so a row already synced here
-- from ServiceNow (sharing that id, per the dual-write identity convention)
-- is left untouched and a CSM-native row that was never in ServiceNow at all
-- gets its first and only row here. created_by/updated_by take the
-- uploader's/updater's email (resolved via case_attachment's own real
-- uploaded_by/updated_by FKs, which this backfill is the last reader of),
-- matching the free-text convention this table's other rows already use --
-- status (the new column) is what marks the row as entity-service's own
-- from here on, not a dedicated id reference.
INSERT INTO work_item_attachment (
    id, created_on, updated_on, created_by, updated_by, name, content_type,
    work_item_id, size_bytes, storage_key, description, status
)
SELECT
    ca.id, ca.created_on, ca.updated_on,
    COALESCE(uploader.email, ca.uploaded_by::text),
    COALESCE(updater.email, uploader.email, ca.uploaded_by::text),
    ca.filename, ca.mime_type, ca.case_id, ca.size_bytes,
    ca.storage_key, ca.description, ca.status
FROM case_attachment ca
JOIN "user" uploader ON uploader.id = ca.uploaded_by
LEFT JOIN "user" updater ON updater.id = ca.updated_by
ON CONFLICT (id) DO NOTHING;

COMMIT;
