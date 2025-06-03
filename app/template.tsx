import {getLoggedInUser} from "./actions/user-actions";
import VerificationBanner from "./components/verification/verification-banner";
import {Box} from "@mui/material";
import {findUserById} from "./db/users-repository";
import {VerificationOverlay} from "./components/verification/verification-overlay";
import Transition from "./transition";

export default async function Template({
                                         // Layouts must accept a children prop.
                                         // This will be populated with nested layouts or pages
                                         children,
                                       }: {
  children: React.ReactNode
}) {
  const user = await getLoggedInUser();
  const isVerified = user &&
    //Solve use case in which the user has just been verified but the session is not updated
    (user.emailVerified || (await findUserById(user.id)).email_verified);

  // Check if email verification is required
  const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

  return (
    <>
      {requireEmailVerification && (user && !isVerified) && (
        <VerificationBanner/>
      )}

      {/* Render children normally if verification is not required, user is verified, or not logged in */}
      {(!requireEmailVerification || !user || isVerified) ? (
        children
      ) : (
        /* Render a non-actionable overlay if user is not verified and verification is required */
        (<Box position="relative">
          {/* Apply a non-interactive overlay */}
          <VerificationOverlay/>
          {/* Render children but make them non-interactive */}
          <Box
            sx={{
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {children}
          </Box>
        </Box>)
      )}
    </>
  );
}
