import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RemoveMembersDialog from '../../../app/components/friend-groups/remove-members-dialog';
import { renderWithTheme } from '../../utils/test-utils';

vi.mock('@/app/actions/prode-group-actions', () => ({
  removeGroupMembersAction: vi.fn(),
}));

import * as groupActions from '@/app/actions/prode-group-actions';
const mockRemoveGroupMembersAction = vi.mocked(groupActions.removeGroupMembersAction)

const OWNER_ID = 'owner-1'
const GROUP_ID = 'group-1'

const ownerMember = { id: OWNER_ID, nombre: 'Alice', is_admin: false }
const adminMember = { id: 'admin-1', nombre: 'Bob', is_admin: true }
const regularMember1 = { id: 'member-1', nombre: 'Carol', is_admin: false }
const regularMember2 = { id: 'member-2', nombre: 'David', is_admin: false }

const allMembers = [ownerMember, adminMember, regularMember1, regularMember2]

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  groupId: GROUP_ID,
  members: allMembers,
  ownerId: OWNER_ID,
  isOwner: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRemoveGroupMembersAction.mockResolvedValue(undefined)
})

describe('RemoveMembersDialog', () => {
  it('renders only non-admin members when viewer is a non-owner admin', () => {
    renderWithTheme(<RemoveMembersDialog {...defaultProps} isOwner={false} />)

    expect(screen.getByText('Carol')).toBeInTheDocument()
    expect(screen.getByText('David')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('renders admin and regular members (excluding owner) when viewer is owner', () => {
    renderWithTheme(<RemoveMembersDialog {...defaultProps} isOwner={true} />)

    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
    expect(screen.getByText('David')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('"Remove" button is disabled when no member is selected', () => {
    renderWithTheme(<RemoveMembersDialog {...defaultProps} />)

    const removeButton = screen.getByRole('button', { name: /Eliminar \(0\)/i })
    expect(removeButton).toBeDisabled()
  })

  it('selecting a member enables the Remove button with count label', () => {
    renderWithTheme(<RemoveMembersDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('Carol'))

    const removeButton = screen.getByRole('button', { name: /Eliminar \(1\)/i })
    expect(removeButton).not.toBeDisabled()
  })

  it('calls removeGroupMembersAction with correct groupId and selectedIds on confirm', async () => {
    renderWithTheme(<RemoveMembersDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('Carol'))
    fireEvent.click(screen.getByRole('button', { name: /Eliminar \(1\)/i }))

    await waitFor(() => {
      expect(mockRemoveGroupMembersAction).toHaveBeenCalledWith(GROUP_ID, ['member-1'])
    })
  })

  it('calls onSuccess with removed IDs after successful removal', async () => {
    const onSuccess = vi.fn()
    renderWithTheme(<RemoveMembersDialog {...defaultProps} onSuccess={onSuccess} />)

    fireEvent.click(screen.getByText('Carol'))
    fireEvent.click(screen.getByRole('button', { name: /Eliminar \(1\)/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(['member-1'])
    })
  })

  it('shows error Alert inside dialog when removeGroupMembersAction throws; dialog stays open', async () => {
    mockRemoveGroupMembersAction.mockRejectedValue(new Error('Only the group owner can remove admins'))
    const onClose = vi.fn()
    renderWithTheme(<RemoveMembersDialog {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Carol'))
    fireEvent.click(screen.getByRole('button', { name: /Eliminar \(1\)/i }))

    await waitFor(() => {
      expect(screen.getByText('Only the group owner can remove admins')).toBeInTheDocument()
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Cancel button calls onClose without removing anyone', () => {
    const onClose = vi.fn()
    renderWithTheme(<RemoveMembersDialog {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Carol'))
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(onClose).toHaveBeenCalled()
    expect(mockRemoveGroupMembersAction).not.toHaveBeenCalled()
  })
})
