# Components: Auth & Onboarding

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** 2026-05-03

---

## Files

### app/components/auth/email-input-form.tsx
Email input with Google sign-in option. [Client] form for identifying authentication method.
- **EmailInputForm({ onEmailSubmit }: EmailInputFormProps)**: `JSX.Element` — [Client] Collects email and determines available authentication methods.
  Calls: checkAuthMethods, signIn
  Uses: useTranslations, useLocale
  Renders: TextField, Button

### app/components/auth/forgot-password-form.tsx
Password reset request form. [Client] form submission for initiating password reset.
- **ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps)**: `JSX.Element` — [Client] Sends password reset link after email validation.
  Calls: sendPasswordResetLink
  Uses: useTranslations, useLocale, useForm

### app/components/auth/nickname-setup-dialog.tsx
Dialog for setting nickname during OAuth flow. [Client] modal for nickname configuration.
- **NicknameSetupDialog({ open, onClose }: NicknameSetupDialogProps)**: `JSX.Element` — [Client] Modal dialog for new OAuth users to set their nickname.
  Calls: setNickname
  Uses: useTranslations, useLocale, useSession
  Renders: Dialog, TextField, Button

### app/components/auth/reset-sent-view.tsx
Confirmation view after password reset link sent. [Client] display-only confirmation message.
- **ResetSentView({ email }: ResetSentViewProps)**: `JSX.Element` — [Client] Shows confirmation that password reset link was sent.
  Uses: useTranslations

### app/components/auth/verification-sent-view.tsx
Confirmation view after signup with email verification. [Client] display-only confirmation with user details.
- **VerificationSentView({ user }: VerificationSentViewProps)**: `JSX.Element` — [Client] Displays email verification confirmation after signup.
  Uses: useTranslations
  Renders: Alert, Typography, EmailIcon

### app/components/auth/login-form.tsx
Email and password login form. [Client] form with login and OTP fallback option.
- **LoginForm({ onSuccess, email, onOTPLoginClick }: LoginFormProps)**: `JSX.Element` — [Client] Handles credentials-based login with optional OTP fallback.
  Calls: signIn
  Uses: useTranslations, useLocale, useRouter, useSearchParams, useForm

### app/components/auth/login-or-signup-dialog.tsx
Multi-step auth dialog managing email, login, signup, OTP, and account setup flows. [Client] state machine orchestrating complete auth workflow.
- **LoginOrSignupDialog({ handleCloseLoginDialog, openLoginDialog }: LoginOrSignupProps)**: `JSX.Element` — [Client] Master dialog component that routes through all authentication flows.
  Calls: checkAuthMethods, sendOTPCode, signIn, signupUser
  Uses: useTranslations, useLocale, useRouter, useSearchParams
  Renders: LoginForm, SignupForm, ForgotPasswordForm, ResetSentView, VerificationSentView, EmailInputForm, OTPVerifyForm, AccountSetupForm

### app/components/auth/otp-verify-form.tsx
Six-digit OTP input form with auto-submit and countdown timers. [Client] interactive OTP entry with UX features.
- **OTPVerifyForm({ email, onSuccess, onCancel, onResend }: OTPVerifyFormProps)**: `JSX.Element` — [Client] Handles OTP verification with timers and auto-advance on complete code.
  Calls: verifyOTPCode
  Uses: useTranslations, useLocale
  Renders: TextField, Alert, Link, Button, Typography

### app/components/auth/signup-form.tsx
Email/password signup form with confirmation fields. [Client] form for new user registration.
- **SignupForm({ onSuccess, email, onOTPSignupClick }: SignupFormProps)**: `JSX.Element` — [Client] Collects email, nickname, and password for new accounts.
  Calls: signupUser, signIn
  Uses: useTranslations, useLocale, useRouter, useForm
  Renders: TextField, Button, Alert

### app/components/auth/user-settings-dialog.tsx
Dialog for updating nickname and notification preferences. [Client] settings modal for logged-in users.
- **UserSettingsDialog({ open, onClose }: UserSettingsDialogProps)**: `JSX.Element` — [Client] Modal for updating user nickname and notification subscriptions.
  Calls: updateNickname, subscribeToNotifications, unsubscribeFromNotifications
  Uses: useTranslations, useLocale, useSession, useForm

### app/components/awards/empty-award-notification.tsx
Snackbar notification when awards predictions are empty. [Client] dismissible notification prompting award completion.
- **EmptyAwardsSnackbar({ tournamentId }: Props)**: `JSX.Element` — [Client] Shows notification to complete awards predictions, dismissible and hidden on awards page.
  Uses: useTranslations, usePathname

### app/components/awards/mobile-friendly-autocomplete.tsx
Mobile-optimized fullscreen autocomplete dropdown. Generic reusable component for mobile-friendly selection.
- **MobileFriendlyAutocomplete<T>({ label, options, groupBy, getOptionLabel, value, onChange, disabled, renderOption, renderInput, ...autocompleteProps }: MobileFriendlyAutocompleteProps<T>)**: `React.ReactNode` — Mobile-optimized autocomplete using fullscreen dialog on smaller screens.
  Renders: Dialog, Autocomplete, AppBar, TextField

### app/components/awards/team-selector.tsx
Dropdown selector for teams with logo display. Component for award team predictions.
- **TeamSelector({ label, teams, selectedTeamId, name, disabled, helperText, onChange, open?, onClose? }: TeamSelectorProps)**: `React.FC<TeamSelectorProps>` — Select team with visual logo representation. `open`/`onClose` allow controlled-open mode for programmatic dismiss.
  Uses: useTranslations
  Renders: Select, MenuItem, Image, FormControl

### app/components/awards/award-panel.tsx
Complete awards prediction interface with podium and individual awards. [Client] interactive panel for tournament awards.
- **PlayerAwardInput({ label, inputRef?, params })**: `JSX.Element` — Module-level presentational component for Autocomplete renderInput; avoids inline component definition
- **AwardsPanel({ allPlayers, tournamentGuesses, teams, hasThirdPlaceGame, isPredictionLocked, tournament, games, gameGuessesArray, tournamentPredictionCompletion, tournamentStartDate, teamsMap }: Props)**: `JSX.Element` — [Client] Manages podium (champion, runner-up, third place) and individual awards (best player, top goalscorer, best goalkeeper, best young player).
  Calls: updateOrCreateTournamentGuess, computeAwardsHeaderVariant
  Uses: useTranslations, useTheme, useMediaQuery, useMemo, useState, useEffect, useCallback
  Renders: TeamSelector, Autocomplete, MobileFriendlyAutocomplete, PredictionStatusHeader, Card, Grid

### app/components/onboarding/onboarding-dialog.tsx
Main onboarding dialog with 7 progressive steps. [Client] state machine for onboarding workflow.
- **OnboardingDialog({ open, onClose, tournament }: OnboardingDialogProps)**: `JSX.Element` — [Client] Progressive 7-step onboarding with dynamic step order based on tournament boosts.
  Calls: markOnboardingComplete, skipOnboardingFlow, saveOnboardingStep
  Uses: useTranslations, useCallback, useRef, useEffect, useMemo, useState
  Renders: WelcomeStep, GamePredictionStep, QualifiedTeamsPredictionStep, TournamentAwardsStep, ScoringExplanationStep, BoostIntroductionStep, ChecklistStep, Dialog, LinearProgress, OnboardingProgress, Button

### app/components/onboarding/onboarding-trigger.tsx
Server component that renders onboarding dialog client. [Server] wrapper for onboarding.
- **OnboardingTrigger()**: `JSX.Element` — [Server] Renders the client component that manages onboarding dialog.
  Renders: OnboardingDialogClient

### app/components/onboarding/onboarding-progress.tsx
Stepper showing onboarding step progress. [Client] progress indicator.
- **OnboardingProgress({ currentStep, totalSteps, includeBoosts }: OnboardingProgressProps)**: `JSX.Element` — [Client] Displays stepper with dynamic steps based on tournament boost availability.
  Uses: useTranslations
  Renders: Stepper, Step, StepLabel, Box

### app/components/onboarding/onboarding-checklist.tsx
Standalone checklist component for onboarding tasks. [Client] display-only checklist.
- **OnboardingChecklist({ items }: OnboardingChecklistProps)**: `JSX.Element` — [Client] Shows onboarding checklist items with completion status and progress percentage.
  Renders: Paper, Typography, List, ListItem, ListItemIcon, CheckCircleIcon, RadioButtonUncheckedIcon

### app/components/onboarding/onboarding-tooltip.tsx
Reusable dismissible tooltip for onboarding hints. [Client] interactive tooltip with persistence.
- **OnboardingTooltip({ id, title, content, children, dismissed }: OnboardingTooltipProps)**: `JSX.Element` — [Client] Tooltip that can be dismissed and stores dismissal state to database.
  Calls: dismissTooltip
  Uses: useState
  Renders: Tooltip, IconButton, Box, CloseIcon

### app/components/onboarding/onboarding-dialog-client.tsx
Client wrapper that loads tournament data and renders OnboardingDialog. [Client] data loading wrapper.
- **OnboardingDialogClient({ initialOpen, onClose }: OnboardingDialogClientProps)**: `JSX.Element` — [Client] Loads active tournament and renders onboarding dialog with loaded data.
  Calls: getTournaments
  Uses: useEffect, useState
  Renders: OnboardingDialog

### app/components/onboarding/onboarding-steps/index.ts
Barrel export of all onboarding step components. Module exports.
- Exports: WelcomeStep, GamePredictionStep, QualifiedTeamsPredictionStep, TournamentAwardsStep, ScoringExplanationStep, BoostIntroductionStep, ChecklistStep

### app/components/verification/email-verifier.tsx
Email verification token handler with redirect on success. [Client] token verification interface.
- **EmailVerifier({ token }: EmailVerifierProps)**: `JSX.Element` — [Client] Verifies email token, signs user out on success with redirect to login.
  Calls: verifyUserEmail, signOut
  Uses: useTranslations, useLocale, useRouter, useCallback, useEffect, useState
  Renders: Alert, Typography, Paper, AuthPageSkeleton

### app/components/verification/verification-overlay.tsx
Semi-transparent overlay for verification page. [Client] display helper.
- **VerificationOverlay()**: `JSX.Element` — [Client] Renders backdrop overlay with optional blur effect, hidden on verification page.
  Uses: usePathname
  Renders: Box

### app/components/verification/verification-banner.tsx
Warning banner for unverified emails with resend option. [Client] persistent notification banner.
- **VerificationBanner()**: `JSX.Element` — [Client] Shows warning banner to unverified users with resend verification email button, hidden on verification page.
  Calls: resendVerificationEmail
  Uses: useState, usePathname
  Renders: Alert, Button, Snackbar, Typography