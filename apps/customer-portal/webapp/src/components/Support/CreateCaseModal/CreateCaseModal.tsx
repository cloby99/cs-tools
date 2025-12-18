// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Chip,
  Card,
  IconButton,
} from "@mui/material";
import { Close, CheckCircle, AutoAwesome } from "@mui/icons-material";
import { Endpoints } from "../../../services/endpoints";
import apiClient from "../../../services/apiClient";

interface FilterOptions {
  statuses: string[];
  severities: string[];
  categories: string[];
  products: string[];
  environments: string[];
}

interface CreateCaseModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  filterOptions?: FilterOptions;
}

interface FormData {
  product: string;
  deployment: string;
  title: string;
  description: string;
  issueType: string;
  severity: string;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  open,
  onClose,
  projectId,
  projectName,
  filterOptions,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    product: "",
    deployment: "",
    title: "",
    description: "",
    issueType: "",
    severity: "S2",
  });

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name?: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value as string }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Map form data to API request body
      const requestBody = {
        short_description: formData.title,
        description: formData.description,
        category: formData.issueType,
        priority: formData.severity,
        product: formData.product,
        u_project_deployment: formData.deployment,
      };

      // Get the endpoint and construct URL
      const endpoint = Endpoints.postCase(projectId);
      const url = `${endpoint.baseUrl}${endpoint.path}`;

      // Make the API call
      const response = await apiClient.post<{
        caseId: string;
        projectId: string;
      }>(url, requestBody);

      // Navigate to the created case details page
      if (response.data?.caseId && response.data?.projectId) {
        navigate(`/${response.data.projectId}/case/${response.data.caseId}`);
      }
    } catch (err) {
      console.error("Error creating case:", err);
      setError("Failed to create case. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "S0":
        return { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" };
      case "S1":
        return { bg: "#FFEDD5", text: "#C2410C", dot: "#F97316" };
      case "S2":
        return { bg: "#FEF9C3", text: "#A16207", dot: "#EAB308" };
      case "S3":
        return { bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" };
      case "S4":
        return { bg: "#F3F4F6", text: "#374151", dot: "#6B7280" };
      default:
        return { bg: "#FEF9C3", text: "#A16207", dot: "#EAB308" };
    }
  };

  const severityColors = getSeverityColor(formData.severity);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ color: "#111827", fontWeight: 600 }}>
              Review Case Details
            </Typography>
            <Typography variant="body2" sx={{ color: "#6B7280", mt: 0.5 }}>
              Please review and edit the information before submitting
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={<AutoAwesome sx={{ fontSize: 14 }} />}
              label="AI Generated"
              size="small"
              sx={{
                bgcolor: "#FFEDD5",
                color: "#C2410C",
                borderColor: "#FED7AA",
                border: "1px solid",
                height: 24,
              }}
            />
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Info Banner */}
            <Card
              sx={{
                bgcolor: "#FFF7ED",
                border: "1px solid #FED7AA",
                p: 2,
                boxShadow: 0,
              }}
            >
              <Box display="flex" gap={1.5}>
                <CheckCircle
                  sx={{ color: "#EA580C", fontSize: 20, mt: 0.25 }}
                />
                <Box>
                  <Typography
                    sx={{ fontSize: "0.875rem", color: "#111827", mb: 0.5 }}
                  >
                    Case details auto-populated from your conversation
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>
                    All fields below have been filled based on your chat with
                    Novera. Please review and edit as needed.
                  </Typography>
                </Box>
              </Box>
            </Card>

            {/* Error Message */}
            {error && (
              <Card
                sx={{
                  bgcolor: "#FEE2E2",
                  border: "1px solid #FCA5A5",
                  p: 2,
                  boxShadow: 0,
                }}
              >
                <Typography sx={{ fontSize: "0.875rem", color: "#B91C1C" }}>
                  {error}
                </Typography>
              </Card>
            )}

            {/* Basic Information Section */}
            <Card sx={{ p: 3, boxShadow: 0, border: "1px solid #E5E7EB" }}>
              <Typography
                variant="h6"
                sx={{ mb: 3, color: "#111827", fontSize: "1rem" }}
              >
                Basic Information
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Project (Read-only) */}
                <FormControl fullWidth size="small">
                  <InputLabel>Project *</InputLabel>
                  <Select
                    value={projectName}
                    label="Project *"
                    disabled
                    sx={{ bgcolor: "#F9FAFB" }}
                  >
                    <MenuItem value={projectName}>{projectName}</MenuItem>
                  </Select>
                </FormControl>

                {/* Product & Version */}
                <FormControl fullWidth size="small">
                  <InputLabel>Product & Version *</InputLabel>
                  <Select
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    label="Product & Version *"
                    required
                  >
                    {filterOptions?.products.map((product) => (
                      <MenuItem key={product} value={product}>
                        {product}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Deployment Type */}
                <FormControl fullWidth size="small">
                  <InputLabel>Deployment Type *</InputLabel>
                  <Select
                    name="deployment"
                    value={formData.deployment}
                    onChange={handleChange}
                    label="Deployment Type *"
                    required
                  >
                    {filterOptions?.environments.map((env) => (
                      <MenuItem key={env} value={env}>
                        {env}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Card>

            {/* Case Details Section */}
            <Card sx={{ p: 3, boxShadow: 0, border: "1px solid #E5E7EB" }}>
              <Typography
                variant="h6"
                sx={{ mb: 3, color: "#111827", fontSize: "1rem" }}
              >
                Case Details
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Issue Title */}
                <TextField
                  fullWidth
                  size="small"
                  name="title"
                  label="Issue Title *"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter issue title"
                />

                {/* Case Description */}
                <TextField
                  fullWidth
                  name="description"
                  label="Case Description *"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  multiline
                  rows={4}
                  placeholder="Describe the issue in detail"
                  helperText="Provide all relevant details about the issue"
                />

                {/* Issue Type */}
                <FormControl fullWidth size="small">
                  <InputLabel>Issue Type *</InputLabel>
                  <Select
                    name="issueType"
                    value={formData.issueType}
                    onChange={handleChange}
                    label="Issue Type *"
                    required
                  >
                    {filterOptions?.categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Severity Level */}
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      Severity Level *
                    </Typography>
                    <Chip
                      icon={<AutoAwesome sx={{ fontSize: 12 }} />}
                      label="AI assessed"
                      size="small"
                      sx={{
                        bgcolor: "#F3F4F6",
                        height: 20,
                        fontSize: "0.75rem",
                      }}
                    />
                  </Box>
                  <Card
                    sx={{
                      p: 2,
                      bgcolor: severityColors.bg,
                      border: `1px solid ${severityColors.bg}`,
                      boxShadow: 0,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: severityColors.dot,
                        }}
                      />
                      <Box>
                        <Typography
                          sx={{
                            color: severityColors.text,
                            fontWeight: 600,
                            fontSize: "0.875rem",
                          }}
                        >
                          {formData.severity} - Medium
                        </Typography>
                        <Typography
                          sx={{
                            color: severityColors.text,
                            fontSize: "0.75rem",
                          }}
                        >
                          Important features affected
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                  <Typography
                    sx={{ fontSize: "0.75rem", color: "#6B7280", mt: 1 }}
                  >
                    Based on deployment type and issue description
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #E5E7EB" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            color: "#374151",
            borderColor: "#D1D5DB",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<CheckCircle />}
          disabled={isSubmitting}
          sx={{
            textTransform: "none",
            bgcolor: "#EA580C",
            "&:hover": { bgcolor: "#C2410C" },
            "&:disabled": { bgcolor: "#D1D5DB" },
          }}
        >
          {isSubmitting ? "Creating..." : "Create Support Case"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
