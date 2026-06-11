import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as userActions from '../../app/actions/user-actions'
import * as groupRepository from '../../app/db/prode-group-repository'
import { removeGroupMembersAction } from '../../app/actions/prode-group-actions'
import { testFactories } from '../db/test-factories'

vi.mock('../../auth', () => ({ auth: vi.fn() }))
vi.mock('../../app/actions/user-actions')
vi.mock('../../app/db/prode-group-repository')

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser)
const mockFindProdeGroupById = vi.mocked(groupRepository.findProdeGroupById)
const mockFindParticipantsInGroup = vi.mocked(groupRepository.findParticipantsInGroup)
const mockDeleteParticipantFromGroup = vi.mocked(groupRepository.deleteParticipantFromGroup)

const OWNER_ID = 'owner-1'
const ADMIN_ID = 'admin-1'
const MEMBER_ID = 'member-1'
const GROUP_ID = 'group-1'

const defaultGroup = testFactories.prodeGroup({ id: GROUP_ID, owner_user_id: OWNER_ID })
const ownerUser = testFactories.user({ id: OWNER_ID })
const adminUser = testFactories.user({ id: ADMIN_ID })
const memberUser = testFactories.user({ id: MEMBER_ID })

const participants = [
  { user_id: ADMIN_ID, is_admin: true },
  { user_id: MEMBER_ID, is_admin: false },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockFindProdeGroupById.mockResolvedValue(defaultGroup as any)
  mockFindParticipantsInGroup.mockResolvedValue(participants as any)
  mockDeleteParticipantFromGroup.mockResolvedValue(undefined as any)
})

describe('removeGroupMembersAction', () => {
  it('throws when caller is not authenticated', async () => {
    mockGetLoggedInUser.mockResolvedValue(null as any)

    await expect(removeGroupMembersAction(GROUP_ID, [MEMBER_ID])).rejects.toThrow(
      'Should not call this action from a logged out page'
    )
    expect(mockDeleteParticipantFromGroup).not.toHaveBeenCalled()
  })

  it('throws when group does not exist', async () => {
    mockGetLoggedInUser.mockResolvedValue(ownerUser as any)
    mockFindProdeGroupById.mockResolvedValue(undefined as any)

    await expect(removeGroupMembersAction(GROUP_ID, [MEMBER_ID])).rejects.toThrow('Group not found')
    expect(mockDeleteParticipantFromGroup).not.toHaveBeenCalled()
  })

  it('throws when caller is neither owner nor admin of the group', async () => {
    const outsider = testFactories.user({ id: 'outsider-1' })
    mockGetLoggedInUser.mockResolvedValue(outsider as any)

    await expect(removeGroupMembersAction(GROUP_ID, [MEMBER_ID])).rejects.toThrow(
      'Only group admins can remove members'
    )
    expect(mockDeleteParticipantFromGroup).not.toHaveBeenCalled()
  })

  it('throws when admin attempts to remove another admin', async () => {
    mockGetLoggedInUser.mockResolvedValue(adminUser as any)

    await expect(removeGroupMembersAction(GROUP_ID, [ADMIN_ID])).rejects.toThrow(
      'Only the group owner can remove admins'
    )
    expect(mockDeleteParticipantFromGroup).not.toHaveBeenCalled()
  })

  it('allows owner to remove a mix of admins and regular members', async () => {
    mockGetLoggedInUser.mockResolvedValue(ownerUser as any)

    await removeGroupMembersAction(GROUP_ID, [ADMIN_ID, MEMBER_ID])

    expect(mockDeleteParticipantFromGroup).toHaveBeenCalledWith(GROUP_ID, ADMIN_ID)
    expect(mockDeleteParticipantFromGroup).toHaveBeenCalledWith(GROUP_ID, MEMBER_ID)
    expect(mockDeleteParticipantFromGroup).toHaveBeenCalledTimes(2)
  })

  it('allows admin to remove regular members only', async () => {
    mockGetLoggedInUser.mockResolvedValue(adminUser as any)

    await removeGroupMembersAction(GROUP_ID, [MEMBER_ID])

    expect(mockDeleteParticipantFromGroup).toHaveBeenCalledWith(GROUP_ID, MEMBER_ID)
    expect(mockDeleteParticipantFromGroup).toHaveBeenCalledTimes(1)
  })

  it('no-ops silently if memberIds is empty', async () => {
    mockGetLoggedInUser.mockResolvedValue(ownerUser as any)

    await expect(removeGroupMembersAction(GROUP_ID, [])).resolves.toBeUndefined()
    expect(mockDeleteParticipantFromGroup).not.toHaveBeenCalled()
  })

  it('silently skips the owner when owner id is in memberIds', async () => {
    mockGetLoggedInUser.mockResolvedValue(ownerUser as any)

    await removeGroupMembersAction(GROUP_ID, [OWNER_ID, MEMBER_ID])

    expect(mockDeleteParticipantFromGroup).not.toHaveBeenCalledWith(GROUP_ID, OWNER_ID)
    expect(mockDeleteParticipantFromGroup).toHaveBeenCalledWith(GROUP_ID, MEMBER_ID)
  })

  it('calls deleteParticipantFromGroup once per valid memberId', async () => {
    mockGetLoggedInUser.mockResolvedValue(ownerUser as any)
    const extraMember = 'member-2'
    mockFindParticipantsInGroup.mockResolvedValue([
      ...participants,
      { user_id: extraMember, is_admin: false },
    ] as any)

    await removeGroupMembersAction(GROUP_ID, [MEMBER_ID, extraMember])

    expect(mockDeleteParticipantFromGroup).toHaveBeenCalledTimes(2)
  })
})
