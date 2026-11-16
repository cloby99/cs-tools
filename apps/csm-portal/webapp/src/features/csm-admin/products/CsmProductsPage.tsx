// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { useMemo, useState, type JSX } from "react";
import {
  useCatalogProducts,
  useCatalogVersions,
  useCreateProduct,
  useCreateVersion,
  useSetProductActive,
  useUpdateVersion,
  type CatalogProduct,
  type CatalogVersion,
} from "@features/csm-admin/products/useProductCatalog";
import {
  EMPTY_PRODUCT_DRAFT,
  EMPTY_VERSION_DRAFT,
  MAX_DEPLOYMENT_PROFILE_LENGTH,
  MAX_PRODUCT_DESCRIPTION_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_VERSION_LENGTH,
  PRODUCT_CLASS_LABEL,
  PRODUCT_UNIT_OPTIONS,
  SUPPORT_STATUS_OPTIONS,
  buildCreateProduct,
  buildCreateVersion,
  buildVersionPatch,
  productDraftError,
  toDateInput,
  toSupportStatus,
  versionDraftError,
  versionDraftFrom,
  type ProductClass,
  type ProductDraft,
  type SupportStatus,
  type VersionDraft,
} from "@features/csm-admin/products/productCatalogForm";

const STATUS_LABEL: Record<SupportStatus, string> = Object.fromEntries(
  SUPPORT_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<SupportStatus, string>;

function ActiveChip({ active }: { active: boolean }): JSX.Element {
  return active ? (
    <Chip size="small" color="success" variant="outlined" label="Active" />
  ) : (
    <Chip size="small" variant="outlined" label="Retired" />
  );
}

function dateOrDash(value: string | null): string {
  return toDateInput(value) || "—";
}

/** What to retire or restore, asked about before anything is sent. */
type PendingToggle =
  | { kind: "product"; product: CatalogProduct }
  | { kind: "version"; product: CatalogProduct; version: CatalogVersion };

function ProductDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  const create = useCreateProduct();
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_PRODUCT_DRAFT);
  const [touched, setTouched] = useState(false);
  const error = productDraftError(draft);

  function close(): void {
    setDraft(EMPTY_PRODUCT_DRAFT);
    setTouched(false);
    create.reset();
    onClose();
  }

  function save(): void {
    setTouched(true);
    if (error) return;
    create.mutate(buildCreateProduct(draft), { onSuccess: close });
  }

  return (
    <Dialog open={open} onClose={create.isPending ? undefined : close} fullWidth maxWidth="sm">
      <DialogTitle>Add product</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {create.isError && <Alert severity="error">{create.error.message}</Alert>}
          <TextField
            label="Name"
            required
            autoFocus
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            error={touched && error !== null && !draft.name.trim()}
            helperText={touched && error ? error : undefined}
            slotProps={{ htmlInput: { maxLength: MAX_PRODUCT_NAME_LENGTH } }}
          />
          <TextField
            select
            label="Class"
            value={draft.productClass}
            onChange={(e) => setDraft({ ...draft, productClass: e.target.value as ProductClass })}
            helperText="Only software products have versions. The class cannot be changed later."
          >
            {(Object.keys(PRODUCT_CLASS_LABEL) as ProductClass[]).map((value) => (
              <MenuItem key={value} value={value}>
                {PRODUCT_CLASS_LABEL[value]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Unit"
            value={draft.unit}
            onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          >
            <MenuItem value="">None</MenuItem>
            {PRODUCT_UNIT_OPTIONS.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            multiline
            minRows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            slotProps={{ htmlInput: { maxLength: MAX_PRODUCT_DESCRIPTION_LENGTH } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={create.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={create.isPending}>
          Add product
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function VersionDialog({
  product,
  editing,
  open,
  onClose,
}: {
  product: CatalogProduct;
  /** The version being edited, or null to add one. */
  editing: CatalogVersion | null;
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  const create = useCreateVersion();
  const update = useUpdateVersion();
  const mutation = editing ? update : create;
  const [draft, setDraft] = useState<VersionDraft>(editing ? versionDraftFrom(editing) : EMPTY_VERSION_DRAFT);
  const [touched, setTouched] = useState(false);
  const error = versionDraftError(draft);
  const patch = editing ? buildVersionPatch(editing, draft) : null;
  const nothingChanged = patch !== null && Object.keys(patch).length === 0;

  function close(): void {
    create.reset();
    update.reset();
    onClose();
  }

  function save(): void {
    setTouched(true);
    if (error) return;
    if (editing && patch) {
      update.mutate({ productId: product.id, versionId: editing.id, body: patch }, { onSuccess: close });
    } else {
      create.mutate({ productId: product.id, body: buildCreateVersion(draft) }, { onSuccess: close });
    }
  }

  const dateField = (
    label: string,
    key: "releaseDate" | "supportEolDate" | "earliestPossibleSupportEolDate",
  ): JSX.Element => (
    <TextField
      type="date"
      label={label}
      value={draft[key]}
      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : close} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? `Edit version ${editing.version}` : `Add version to ${product.name}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {mutation.isError && <Alert severity="error">{mutation.error.message}</Alert>}
          <TextField
            label="Version"
            required
            autoFocus
            value={draft.version}
            onChange={(e) => setDraft({ ...draft, version: e.target.value })}
            error={touched && error !== null && !draft.version.trim()}
            helperText={touched && error ? error : undefined}
            slotProps={{ htmlInput: { maxLength: MAX_VERSION_LENGTH } }}
          />
          <TextField
            label="Deployment profile"
            value={draft.deploymentProfile}
            onChange={(e) => setDraft({ ...draft, deploymentProfile: e.target.value })}
            helperText="Optional, for example All In One. The same version can exist once per profile."
            slotProps={{ htmlInput: { maxLength: MAX_DEPLOYMENT_PROFILE_LENGTH } }}
          />
          <TextField
            select
            label="Support status"
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as SupportStatus })}
          >
            {SUPPORT_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {dateField("Release date", "releaseDate")}
          {dateField("Support end date", "supportEolDate")}
          {dateField("Earliest possible support end date", "earliestPossibleSupportEolDate")}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={mutation.isPending || nothingChanged}>
          {editing ? "Save changes" : "Add version"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function VersionsPanel({ product }: { product: CatalogProduct }): JSX.Element {
  const versions = useCatalogVersions(product.id);
  const update = useUpdateVersion();
  const [dialog, setDialog] = useState<{ editing: CatalogVersion | null } | null>(null);
  const [pending, setPending] = useState<CatalogVersion | null>(null);

  const rows = versions.data ?? [];

  function confirmToggle(): void {
    if (!pending) return;
    update.mutate(
      { productId: product.id, versionId: pending.id, body: { active: !pending.active } },
      { onSuccess: () => setPending(null) },
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6">Versions of {product.name}</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Plus size={16} />}
          onClick={() => setDialog({ editing: null })}
          disabled={!product.active}
        >
          Add version
        </Button>
      </Stack>
      {!product.active && (
        <Alert severity="info" sx={{ mb: 1 }}>
          This product is retired. Restore it to add versions.
        </Alert>
      )}
      {versions.isError && <Alert severity="error">Failed to load versions.</Alert>}
      {versions.isLoading ? (
        <Skeleton variant="rounded" height={80} />
      ) : (
        <TableContainer>
          <Table size="small" aria-label={`Versions of ${product.name}`}>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Deployment profile</TableCell>
                <TableCell>Support status</TableCell>
                <TableCell>Release date</TableCell>
                <TableCell>Support end</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>No versions yet.</TableCell>
                </TableRow>
              )}
              {rows.map((version) => (
                <TableRow key={version.id} sx={{ opacity: version.active ? 1 : 0.6 }}>
                  <TableCell>{version.version}</TableCell>
                  <TableCell>{version.deploymentProfile ?? "—"}</TableCell>
                  <TableCell>{STATUS_LABEL[toSupportStatus(version.currentSupportStatus)]}</TableCell>
                  <TableCell>{dateOrDash(version.releaseDate)}</TableCell>
                  <TableCell>{dateOrDash(version.supportEolDate)}</TableCell>
                  <TableCell>
                    <ActiveChip active={version.active} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setDialog({ editing: version })}>
                      Edit
                    </Button>
                    <Button size="small" color={version.active ? "error" : "primary"} onClick={() => setPending(version)}>
                      {version.active ? "Retire" : "Restore"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {dialog && (
        <VersionDialog
          // A fresh draft per version, so editing one never shows another's values.
          key={dialog.editing?.id ?? "new"}
          product={product}
          editing={dialog.editing}
          open
          onClose={() => setDialog(null)}
        />
      )}

      <Dialog open={pending !== null} onClose={update.isPending ? undefined : () => setPending(null)}>
        <DialogTitle>{pending?.active ? "Retire version?" : "Restore version?"}</DialogTitle>
        <DialogContent>
          {update.isError && <Alert severity="error" sx={{ mb: 1 }}>{update.error.message}</Alert>}
          <DialogContentText>
            {pending?.active
              ? `Version ${pending.version} stops appearing when someone picks a version. Deployments that already use it are not changed, and you can restore it later.`
              : `Version ${pending?.version ?? ""} will appear in version pickers again.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} disabled={update.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={pending?.active ? "error" : "primary"}
            onClick={confirmToggle}
            disabled={update.isPending}
          >
            {pending?.active ? "Retire" : "Restore"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

/**
 * Settings > Products (admin only): add a product, add and edit the versions of
 * a software product, and retire or restore either. Retiring is a soft delete
 * (entity-service's `active` flag): the entry leaves the pickers but nothing
 * that already uses it changes, and it can be restored.
 */
export default function CsmProductsPage(): JSX.Element {
  const products = useCatalogProducts();
  const setActive = useSetProductActive();
  const [showRetired, setShowRetired] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingToggle | null>(null);

  const rows = useMemo(
    () => (products.data ?? []).filter((product) => showRetired || product.active),
    [products.data, showRetired],
  );
  const selected = (products.data ?? []).find((product) => product.id === selectedId) ?? null;
  const showVersions = selected !== null && selected.class === "software";

  function confirmToggle(): void {
    if (pending?.kind !== "product") return;
    const { product } = pending;
    setActive.mutate({ id: product.id, active: !product.active }, { onSuccess: () => setPending(null) });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h6">Products</Typography>
          <Typography variant="body2" color="text.secondary">
            The products and versions people can pick across the portal. Retiring one hides it from pickers without
            touching anything that already uses it.
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={2}>
          <FormControlLabel
            control={<Switch checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />}
            label="Show retired"
          />
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setAdding(true)}>
            Add product
          </Button>
        </Stack>
      </Stack>

      {products.isError && <Alert severity="error">Failed to load products.</Alert>}
      {products.isLoading ? (
        <Skeleton variant="rounded" height={160} />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Products">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>No products.</TableCell>
                </TableRow>
              )}
              {rows.map((product) => (
                <TableRow
                  key={product.id}
                  hover
                  selected={product.id === selectedId}
                  sx={{ opacity: product.active ? 1 : 0.6 }}
                >
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{PRODUCT_CLASS_LABEL[product.class] ?? product.class}</TableCell>
                  <TableCell>
                    <ActiveChip active={product.active} />
                  </TableCell>
                  <TableCell align="right">
                    {product.class === "software" && (
                      <Button size="small" onClick={() => setSelectedId(product.id === selectedId ? null : product.id)}>
                        {product.id === selectedId ? "Hide versions" : "Versions"}
                      </Button>
                    )}
                    <Button
                      size="small"
                      color={product.active ? "error" : "primary"}
                      onClick={() => setPending({ kind: "product", product })}
                    >
                      {product.active ? "Retire" : "Restore"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {showVersions && <VersionsPanel key={selected.id} product={selected} />}

      <ProductDialog open={adding} onClose={() => setAdding(false)} />

      <Dialog open={pending !== null} onClose={setActive.isPending ? undefined : () => setPending(null)}>
        <DialogTitle>{pending?.kind === "product" && pending.product.active ? "Retire product?" : "Restore product?"}</DialogTitle>
        <DialogContent>
          {setActive.isError && <Alert severity="error" sx={{ mb: 1 }}>{setActive.error.message}</Alert>}
          <DialogContentText>
            {pending?.kind === "product" && pending.product.active
              ? `${pending.product.name} stops appearing when someone picks a product. Its versions, deployments and cases are not changed, and you can restore it later.`
              : `${pending?.product.name ?? ""} will appear in product pickers again. Versions that were retired stay retired.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} disabled={setActive.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={pending?.kind === "product" && pending.product.active ? "error" : "primary"}
            onClick={confirmToggle}
            disabled={setActive.isPending}
          >
            {pending?.kind === "product" && pending.product.active ? "Retire" : "Restore"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
