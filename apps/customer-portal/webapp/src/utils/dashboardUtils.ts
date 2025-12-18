import type { ProjectMetadataResponse } from "../types/project-metadata.types";

export const getOutstandingIncidentsData = (
  projectMetadata: ProjectMetadataResponse | undefined
) => {
  return projectMetadata
    ? [
        {
          name: "Critical (S0)",
          value: projectMetadata.projectStatistics.incidentCount.s0,
          color: "#ef4444",
        },
        {
          name: "High (S1)",
          value: projectMetadata.projectStatistics.incidentCount.s1,
          color: "#f97316",
        },
        {
          name: "Medium (S2)",
          value: projectMetadata.projectStatistics.incidentCount.s2,
          color: "#6366f1",
        },
        {
          name: "Low (S3)",
          value: projectMetadata.projectStatistics.incidentCount.s3,
          color: "#22d3ee",
        },
        {
          name: "Minimal (S4)",
          value: projectMetadata.projectStatistics.incidentCount.s4,
          color: "#9ca3af",
        },
      ]
    : [];
};

export const getActiveCasesData = (
  projectMetadata: ProjectMetadataResponse | undefined
) => {
  return projectMetadata
    ? [
        {
          name: "Awaiting",
          value:
            projectMetadata.projectStatistics.activeCaseCount.awaitingCount,
          color: "#6366f1",
        },
        {
          name: "Work in Progress",
          value:
            projectMetadata.projectStatistics.activeCaseCount
              .workInProgressCount,
          color: "#22d3ee",
        },
        {
          name: "Waiting on WSO2",
          value:
            projectMetadata.projectStatistics.activeCaseCount
              .waitingOnWSO2Count,
          color: "#fb923c",
        },
      ]
    : [];
};
