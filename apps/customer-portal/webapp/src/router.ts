// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/:sysId/announcements`
  | `/:sysId/community`
  | `/:sysId/dashboard`
  | `/:sysId/engagements`
  | `/:sysId/legal-contracts`
  | `/:sysId/project-details`
  | `/:sysId/security-center`
  | `/:sysId/settings`
  | `/:sysId/support`
  | `/:sysId/support/cases`
  | `/:sysId/support/cases/:caseId`
  | `/:sysId/support/cases/create-case`
  | `/:sysId/updates`

export type Params = {
  '/:sysId/announcements': { sysId: string }
  '/:sysId/community': { sysId: string }
  '/:sysId/dashboard': { sysId: string }
  '/:sysId/engagements': { sysId: string }
  '/:sysId/legal-contracts': { sysId: string }
  '/:sysId/project-details': { sysId: string }
  '/:sysId/security-center': { sysId: string }
  '/:sysId/settings': { sysId: string }
  '/:sysId/support': { sysId: string }
  '/:sysId/support/cases': { sysId: string }
  '/:sysId/support/cases/:caseId': { sysId: string; caseId: string }
  '/:sysId/support/cases/create-case': { sysId: string }
  '/:sysId/updates': { sysId: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
