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
  Avatar,
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@wso2/oxygen-ui";
import { useMemo, type JSX } from "react";
import useGetCaseComments from "@api/useGetCaseComments";
import useGetUserDetails from "@api/useGetUserDetails";
import type { CaseComment } from "@models/responses";
import {
  stripCodeWrapper,
  replaceInlineImageSources,
  formatCommentDate,
} from "@utils/support";

export interface CaseDetailsActivityPanelProps {
  projectId: string;
  caseId: string;
  caseCreatedOn?: string | null;
}

/**
 * Renders the Activity tab content: timeline of case comments (current user on right, others on left).
 *
 * @param {CaseDetailsActivityPanelProps} props - projectId, caseId, optional case created date.
 * @returns {JSX.Element} The activity timeline panel.
 */
export default function CaseDetailsActivityPanel({
  projectId,
  caseId,
  caseCreatedOn,
}: CaseDetailsActivityPanelProps): JSX.Element {
  const theme = useTheme();
  const { data: userDetails } = useGetUserDetails();
  const {
    data: commentsData,
    isLoading,
    isError,
  } = useGetCaseComments(projectId, caseId, { offset: 0, limit: 50 });

  const currentUserEmail = userDetails?.email?.toLowerCase() ?? "";

  const commentsSorted = useMemo(() => {
    const list = commentsData?.comments ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime(),
    );
  }, [commentsData?.comments]);

  if (isLoading) {
    return (
      <Box sx={{ border: 1, borderColor: "divider", p: 2 }}>
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Stack
              key={i}
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
            >
              <Skeleton variant="circular" width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    );
  }

  if (isError || !commentsData) {
    return (
      <Box sx={{ border: 1, borderColor: "divider", p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Unable to load activity.
        </Typography>
      </Box>
    );
  }

  const primaryLight = theme.palette.primary?.light ?? "#fa7b3f";
  const primaryBg = alpha(primaryLight, 0.1);

  return (
    <Box sx={{ border: 1, borderColor: "divider", p: 2 }}>
      <Stack spacing={3}>
        {caseCreatedOn && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                flex: 1,
                height: 1,
                bgcolor: "divider",
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Case created on {formatCommentDate(caseCreatedOn)}
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: 1,
                bgcolor: "divider",
              }}
            />
          </Box>
        )}

        {commentsSorted.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No activity yet.
          </Typography>
        ) : (
          commentsSorted.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              isCurrentUser={
                comment.createdBy?.toLowerCase() === currentUserEmail
              }
              primaryBg={primaryBg}
              primaryColor={primaryLight}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}

interface CommentBubbleProps {
  comment: CaseComment;
  isCurrentUser: boolean;
  primaryBg: string;
  primaryColor: string;
}

function CommentBubble({
  comment,
  isCurrentUser,
  primaryBg,
  primaryColor,
}: CommentBubbleProps): JSX.Element {
  const theme = useTheme();
  const rawContent = comment.content ?? "";
  const stripped = stripCodeWrapper(rawContent);
  const htmlContent = replaceInlineImageSources(
    stripped,
    comment.inlineAttachments,
  );
  const displayName = isCurrentUser ? "You" : comment.createdBy || "Unknown";
  const initials = useMemo(() => {
    if (isCurrentUser) return "YO";
    const email = comment.createdBy ?? "";
    const part = email.split("@")[0] ?? "";
    return (
      part
        .replace(/[._-]/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    );
  }, [isCurrentUser, comment.createdBy]);

  const isRight = isCurrentUser;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
      sx={{
        flexDirection: isRight ? "row-reverse" : "row",
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: "0.75rem",
          flexShrink: 0,
          bgcolor: isCurrentUser
            ? primaryBg
            : alpha(theme.palette.info?.light ?? "#0288d1", 0.2),
          color: isCurrentUser
            ? theme.palette.primary.main
            : (theme.palette.info?.main ?? "#0288d1"),
        }}
      >
        {initials}
      </Avatar>
      <Stack
        spacing={1}
        sx={{
          flex: 1,
          minWidth: 0,
          alignItems: isRight ? "flex-end" : "flex-start",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          sx={{
            flexDirection: isRight ? "row-reverse" : "row",
          }}
        >
          <Typography variant="body2" color="text.primary" fontWeight={500}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatCommentDate(comment.createdOn)}
          </Typography>
          {!isCurrentUser && (
            <Chip
              label="Support Engineer"
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: "0.75rem",
                borderColor: "transparent",
                bgcolor: "action.hover",
              }}
            />
          )}
        </Stack>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            maxWidth: "100%",
            bgcolor: isCurrentUser ? primaryBg : "background.paper",
            borderColor: isCurrentUser ? primaryColor : "divider",
            border: 1,
            borderRadius: 0,
          }}
        >
          <Box
            sx={{
              fontSize: "0.75rem",
              "& p": {
                margin: "0 0 0.5em 0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              },
              "& p:last-child": { marginBottom: 0 },
              "& img": {
                display: "block",
                maxWidth: "100%",
                maxHeight: 320,
                height: "auto",
                objectFit: "contain",
                border: 1,
                borderColor: "divider",
                mt: 0.5,
                mb: 0.5,
              },
              "& br": { display: "block", content: '""', marginTop: "0.25em" },
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </Paper>
      </Stack>
    </Stack>
  );
}
