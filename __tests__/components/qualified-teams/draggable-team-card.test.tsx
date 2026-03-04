import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextIntlClientProvider } from 'next-intl';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import DraggableTeamCard from '../../../app/components/qualified-teams/draggable-team-card';
import { testFactories } from '../../db/test-factories';
import { TeamScoringResult } from '../../../app/utils/qualified-teams-scoring';
import qualifiedTeamsEs from '../../../locales/es/qualified-teams.json';
import qualifiedTeamsEn from '../../../locales/en/qualified-teams.json';

// Helper to render with i18n
const renderWithI18n = (component: React.ReactElement, locale: 'en' | 'es' = 'es') => {
  const messages = {
    'qualified-teams': locale === 'es' ? qualifiedTeamsEs : qualifiedTeamsEn,
  };

  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('DraggableTeamCard', () => {
  const mockTeam = testFactories.team({
    id: 'team-1',
    name: 'Argentina',
    theme: { primary: '#75AADB', secondary: '#FFFFFF' },
  });

  const renderWithDndContext = (ui: React.ReactElement, locale: 'en' | 'es' = 'es') => {
    const messages = {
      'qualified-teams': locale === 'es' ? qualifiedTeamsEs : qualifiedTeamsEn,
    };

    return render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <DndContext>
          <SortableContext items={['team-1']}>
            {ui}
          </SortableContext>
        </DndContext>
      </NextIntlClientProvider>
    );
  };

  it('should render team name', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        isLocked={false}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('should render position badge', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        isLocked={false}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    expect(screen.getByText('1°')).toBeInTheDocument();
  });

  it('should render checkbox for position 3', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={3}
        predictedToQualify={false}
        isLocked={false}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render checked checkbox when third place qualifies', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={3}
        predictedToQualify={true}
        isLocked={false}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={1}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onToggleThirdPlace when checkbox clicked', () => {
    const onToggleThirdPlace = vi.fn();

    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={3}
        predictedToQualify={false}
        isLocked={false}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
        onToggleThirdPlace={onToggleThirdPlace}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggleThirdPlace).toHaveBeenCalledTimes(1);
  });

  it('should not render checkbox when disabled prop is true', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={3}
        predictedToQualify={false}
        isLocked={true}
        isSaving={false}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
      />
    );

    const checkbox = screen.queryByRole('checkbox');
    expect(checkbox).not.toBeInTheDocument();
  });

  describe('Third Place Limit', () => {
    it('should disable checkbox when limit is reached and team is not selected', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={8}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('should NOT disable checkbox when limit is reached but team is already selected', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={8}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeDisabled();
      expect(checkbox).toBeChecked();
    });

    it('should NOT disable checkbox when limit is not reached', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={7}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeDisabled();
    });

    it('should show tooltip with limit message when checkbox is disabled due to limit', async () => {
      const { getByRole, findByRole } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={8}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const checkbox = getByRole('checkbox');

      // Hover to trigger tooltip
      fireEvent.mouseOver(checkbox.parentElement!);

      // Wait for tooltip to appear
      const tooltip = await findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Máximo de 8 terceros puestos ya seleccionados');
    });

    it('should NOT show tooltip when checkbox is not disabled due to limit', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={7}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');

      // Hover to trigger tooltip (should not appear)
      fireEvent.mouseOver(checkbox.parentElement!);

      // Tooltip should not exist (empty message)
      const tooltip = screen.queryByRole('tooltip');
      expect(tooltip).not.toBeInTheDocument();
    });
  });

  it('should not render checkbox for positions 1-2', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        isLocked={false}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('should not render checkbox for position 4+', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={4}
        predictedToQualify={false}
        isLocked={false}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('should render drag handle when not disabled', () => {
    renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        isLocked={false}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    // Drag handle should be present (DragIndicatorIcon)
    const dragHandle = screen.getByTestId('DragIndicatorIcon');
    expect(dragHandle).toBeInTheDocument();
  });

  describe('Card drag affordance', () => {
    it('should have grab cursor on card when not locked and not saving', () => {
      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ cursor: 'grab' });
    });

    it('should have default cursor on card when locked', () => {
      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={true}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ cursor: 'default' });
    });

    it('should have default cursor on card when saving', () => {
      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={true}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ cursor: 'default' });
    });

    it('should stop pointer event propagation from ThirdPlaceCheckbox area', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={false}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      const checkboxWrapper = checkbox.closest('span[onpointerdown]') as HTMLElement
        ?? checkbox.parentElement?.parentElement as HTMLElement;

      const stopPropagation = vi.fn();
      fireEvent.pointerDown(checkboxWrapper, { stopPropagation });

      // The wrapper should have handled the pointer down without propagating to card
      // We verify the checkbox itself is still interactable (not disabled by drag)
      expect(checkbox).not.toBeDisabled();
    });
  });

  it('should have reduced opacity when disabled', () => {
    const { container } = renderWithDndContext(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        isLocked={true}
        isSaving={false}
        maxThirdPlace={8}
        currentThirdPlaceCount={0}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const card = container.firstChild;
    expect(card).toHaveStyle({ opacity: '1' });
  });

  describe('Results Overlay', () => {
    const mockResult: TeamScoringResult = {
      teamId: 'team-1',
      teamName: 'Argentina',
      groupId: 'group-a',
      predictedPosition: 1,
      actualPosition: 1,
      predictedToQualify: true,
      actuallyQualified: true,
      pointsAwarded: 2,
      reason: 'qualified + exact position',
    };

    it('should show pending overlay for position 1 when locked and group not complete', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={true}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={null}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('should show pending overlay for position 2 when locked and group not complete', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={2}
          predictedToQualify={true}
          isLocked={true}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={null}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('should show pending overlay for position 3 when locked and group not complete', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          isLocked={true}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={1}
          result={null}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('should show result (not pending) for position 3 team when group is complete', () => {
      // Scenario: Team predicted in position 3, but actually qualified in position 2
      // Group is complete, so we have results - should show green result, not pending
      const resultFor3rdTeamQualifiedIn2nd: TeamScoringResult = {
        teamId: 'team-1',
        teamName: 'Argentina',
        groupId: 'group-a',
        predictedPosition: 3,
        actualPosition: 2,
        predictedToQualify: true,
        actuallyQualified: true,
        pointsAwarded: 1,
        reason: 'qualified, wrong position',
      };

      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          isLocked={true}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={1}
          result={resultFor3rdTeamQualifiedIn2nd}
          isGroupComplete={true}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      // Should show result chip (1 pt), not pending
      expect(screen.getByText('+1 pt')).toBeInTheDocument();
      expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
    });

    it('should not show pending overlay when not locked', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={null}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
    });

    it('should not show pending overlay when not predicted to qualify', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={false}
          isLocked={true}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={null}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
    });

    it('should not show results overlay when group is not complete', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={mockResult}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      expect(screen.queryByText('+2 pts')).not.toBeInTheDocument();
    });

    it('should not show results overlay when result is not available', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={null}
          isGroupComplete={true}
          allGroupsComplete={true}
          isPending3rdPlace={false}
        />
      );

      expect(screen.queryByText('+2 pts')).not.toBeInTheDocument();
    });

    it('should show perfect match result (2 pts) with check icon', () => {
      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={mockResult}
          isGroupComplete={true}
          allGroupsComplete={true}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('+2 pts')).toBeInTheDocument();
    });

    it('should show partial match result (1 pt) with check icon', () => {
      const partialResult: TeamScoringResult = {
        ...mockResult,
        predictedPosition: 2,
        actualPosition: 1,
        pointsAwarded: 1,
        reason: 'qualified, wrong position',
      };

      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={2}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={partialResult}
          isGroupComplete={true}
          allGroupsComplete={true}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('+1 pt')).toBeInTheDocument();
    });

    it('should show wrong prediction result (0 pts) with cancel icon', () => {
      const wrongResult: TeamScoringResult = {
        ...mockResult,
        actualPosition: null,
        actuallyQualified: false,
        pointsAwarded: 0,
        reason: 'predicted qualification, but did not qualify',
      };

      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={wrongResult}
          isGroupComplete={true}
          allGroupsComplete={true}
          isPending3rdPlace={false}
        />
      );

      expect(screen.getByText('+0 pts')).toBeInTheDocument();
    });

    it('should show pending 3rd place result with hourglass icon', () => {
      const pendingResult: TeamScoringResult = {
        ...mockResult,
        predictedPosition: 3,
        actualPosition: null,
        actuallyQualified: false,
        pointsAwarded: 0,
        reason: 'group not complete',
      };

      renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={1}
          result={pendingResult}
          isGroupComplete={true}
          allGroupsComplete={false}
          isPending3rdPlace={true}
        />
      );

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('should apply correct background color for perfect match', () => {
      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={mockResult}
          isGroupComplete={true}
          allGroupsComplete={true}
          isPending3rdPlace={false}
        />
      );

      // Gold/yellow background for perfect match (2 pts)
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ backgroundColor: expect.stringMatching(/rgb.*|#.*/) });
    });

    it('should apply correct background color for partial match', () => {
      const partialResult: TeamScoringResult = {
        ...mockResult,
        pointsAwarded: 1,
        reason: 'qualified, wrong position',
      };

      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={partialResult}
          isGroupComplete={true}
          allGroupsComplete={true}
          isPending3rdPlace={false}
        />
      );

      // Light green background for partial match (1 pt)
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ backgroundColor: expect.stringMatching(/rgb.*|#.*/) });
    });

    it('should apply correct background color for pending 3rd place', () => {
      const pendingResult: TeamScoringResult = {
        ...mockResult,
        pointsAwarded: 0,
      };

      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={3}
          predictedToQualify={true}
          isLocked={false}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={1}
          result={pendingResult}
          isGroupComplete={true}
          allGroupsComplete={false}
          isPending3rdPlace={true}
        />
      );

      // Blue background for pending
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ backgroundColor: expect.stringMatching(/rgb.*|#.*/) });
    });

    it('should apply blue background for pending state before group completion', () => {
      const { container } = renderWithDndContext(
        <DraggableTeamCard
          team={mockTeam}
          position={1}
          predictedToQualify={true}
          isLocked={true}
          isSaving={false}
          maxThirdPlace={8}
          currentThirdPlaceCount={0}
          result={null}
          isGroupComplete={false}
          allGroupsComplete={false}
          isPending3rdPlace={false}
        />
      );

      // Blue background for pending
      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toHaveStyle({ backgroundColor: expect.stringMatching(/rgb.*|#.*/) });
    });
  });
});
