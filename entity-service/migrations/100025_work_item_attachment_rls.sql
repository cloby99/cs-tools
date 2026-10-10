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

BEGIN;

-- work_item_attachment has no project_id of its own -- it reaches one via
-- work_item_id, the same shape case_attachment used (migration 100008)
-- before it was retired in favor of this table. Unlike case_attachment,
-- SearchWorkItemAttachments has so far relied only on its join to work_item
-- (whose own RLS policy, migration 0147, already scopes visibility) rather
-- than a policy of its own -- see that method's doc comment in case_repo.go.
-- Now that entity-service also WRITES to this table (0220's
-- storage_key/description/status columns), it needs the same
-- direct protection case_attachment had: a write path with no policy of its
-- own relies entirely on the application never issuing an unscoped INSERT/
-- UPDATE/DELETE, which RLS exists specifically so nothing has to assume.
ALTER TABLE work_item_attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_attachment FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS work_item_attachment_visibility ON work_item_attachment;
CREATE POLICY work_item_attachment_visibility ON work_item_attachment
  FOR SELECT
  USING (
    current_setting('app.is_internal', true) = 'true'
    OR is_project_member((SELECT wi.project_id FROM work_item wi WHERE wi.id = work_item_attachment.work_item_id))
  );

-- INSERT WITH CHECK has no internal-only restriction, same as
-- case_attachment_write: this table's own row is still gated by the EXISTS
-- check each caller's query already does against work_item (case-like-only
-- for CreateCaseAttachment, the matching work_item_type for a sync-job row).
DROP POLICY IF EXISTS work_item_attachment_write ON work_item_attachment;
CREATE POLICY work_item_attachment_write ON work_item_attachment
  FOR INSERT WITH CHECK (
    current_setting('app.is_internal', true) = 'true'
    OR is_project_member((SELECT wi.project_id FROM work_item wi WHERE wi.id = work_item_id))
  );

DROP POLICY IF EXISTS work_item_attachment_update ON work_item_attachment;
CREATE POLICY work_item_attachment_update ON work_item_attachment
  FOR UPDATE USING (
    current_setting('app.is_internal', true) = 'true'
    OR is_project_member((SELECT wi.project_id FROM work_item wi WHERE wi.id = work_item_attachment.work_item_id))
  )
  WITH CHECK (
    current_setting('app.is_internal', true) = 'true'
    OR is_project_member((SELECT wi.project_id FROM work_item wi WHERE wi.id = work_item_id))
  );

DROP POLICY IF EXISTS work_item_attachment_delete ON work_item_attachment;
CREATE POLICY work_item_attachment_delete ON work_item_attachment
  FOR DELETE USING (
    current_setting('app.is_internal', true) = 'true'
    OR is_project_member((SELECT wi.project_id FROM work_item wi WHERE wi.id = work_item_attachment.work_item_id))
  );

COMMIT;
