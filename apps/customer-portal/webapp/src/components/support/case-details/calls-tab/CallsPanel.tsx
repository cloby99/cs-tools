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

import { Button, Stack } from "@wso2/oxygen-ui";
import { PhoneCall } from "@wso2/oxygen-ui-icons-react";
import { useState, useCallback, type JSX } from "react";
import type { CallRequest } from "@models/responses";
import { useGetCallRequests } from "@api/useGetCallRequests";
import CallsListSkeleton from "@case-details-calls/CallsListSkeleton";
import CallRequestList from "@case-details-calls/CallRequestList";
import CallsEmptyState from "@case-details-calls/CallsEmptyState";
import CallsErrorState from "@case-details-calls/CallsErrorState";
import RequestCallModal from "@case-details-calls/RequestCallModal";
import ErrorBanner from "@components/common/error-banner/ErrorBanner";
import SuccessBanner from "@components/common/success-banner/SuccessBanner";

export interface CallsPanelProps {
  projectId: string;
  caseId: string;
}

/**
 * CallsPanel displays call requests for a specific case.
 *
 * @param {CallsPanelProps} props - The project and case identifiers.
 * @returns {JSX.Element} The rendered calls panel.
 */
export default function CallsPanel({
  projectId,
  caseId,
}: CallsPanelProps): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCall, setEditCall] = useState<CallRequest | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useGetCallRequests(
    projectId,
    caseId,
  );

  const callRequests = data?.callRequests ?? [];

  const handleOpenModal = () => {
    setEditCall(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditCall(null);
  };
  const handleEditClick = (call: CallRequest) => {
    setEditCall(call);
    setIsModalOpen(true);
  };
  const handleSuccess = useCallback(() => {
    setSuccessMessage("Call request submitted successfully.");
    refetch();
  }, [refetch]);
  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  return (
    <Stack spacing={3}>
      {successMessage && (
        <SuccessBanner
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      <Button
        variant="contained"
        color="primary"
        startIcon={<PhoneCall size={16} />}
        sx={{ alignSelf: "flex-start" }}
        onClick={handleOpenModal}
      >
        Request Call
      </Button>

      {isPending ? (
        <CallsListSkeleton />
      ) : isError ? (
        <CallsErrorState />
      ) : callRequests.length === 0 ? (
        <CallsEmptyState />
      ) : (
        <CallRequestList
          requests={callRequests}
          onEditClick={handleEditClick}
        />
      )}

      <RequestCallModal
        open={isModalOpen}
        projectId={projectId}
        caseId={caseId}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        onError={handleError}
        editCall={editCall ?? undefined}
      />
    </Stack>
  );
}
