/**
 * Auth mocking helper.
 *
 * The RTK Query `prepareHeaders` in `client/src/state/api.ts` calls
 * `fetchAuthSession()` and `getCurrentUser()` from `aws-amplify/auth` on
 * every request. Because the AuthProvider is commented out in
 * `dashboardWrapper.tsx`, those calls would normally throw and block all
 * API requests. This helper pre-seeds the Amplify auth storage keys in
 * localStorage before the app boots so E2E tests can run without a real
 * Cognito backend.
 *
 * Amplify v6 stores the Cognito tokens under the key
 * `CognitoIdentityServiceProvider.<client-id>.<username>.idToken`,
 * `... .accessToken`, `... .refreshToken`, plus the `aws-amplify-auth`
 * keys for the sign-in state.
 */

import { Page } from "@playwright/test";

export const AUTH_TOKEN = "e2e-test-access-token";

export const authUsers = {
  owner: {
    userId: 1,
    username: "alice_owner",
    email: "alice@example.com",
    profilePictureUrl: "/avatars/alice.png",
    cognitoId: "cognito-owner",
    teamId: 1,
  },
  member: {
    userId: 2,
    username: "bob_member",
    email: "bob@example.com",
    profilePictureUrl: "/avatars/bob.png",
    cognitoId: "cognito-member",
    teamId: 1,
  },
  outsider: {
    userId: 3,
    username: "carol_outsider",
    email: "carol@example.com",
    profilePictureUrl: "/avatars/carol.png",
    cognitoId: "cognito-outsider",
    teamId: 2,
  },
} as const;

export type AuthUserKey = keyof typeof authUsers;

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || "e2e-test-client";

/**
 * Pre-seed the Amplify auth storage keys in localStorage before the app
 * boots. This is the most reliable way to mock the session because
 * `fetchAuthSession()` reads these keys directly.
 */
export async function setupAuth(
  page: Page,
  asUser: AuthUserKey = "owner",
) {
  const user = authUsers[asUser];
  const providerKey = `CognitoIdentityServiceProvider.${CLIENT_ID}.${user.username}`;

  await page.addInitScript(
    ({ providerKey, user, token }) => {
      const storage: Record<string, string> = {
        [`${providerKey}.idToken`]: token,
        [`${providerKey}.accessToken`]: token,
        [`${providerKey}.refreshToken`]: token,
        "aws-amplify-auth": JSON.stringify({
          username: user.username,
          userId: user.userId,
          email: user.email,
        }),
        "aws-amplify-auth-sign-in-info": JSON.stringify({
          username: user.username,
          loginType: "username",
        }),
      };

      // Patch localStorage before the app boots so the keys are present
      // when Amplify initializes.
      const originalSetItem = window.localStorage.setItem.bind(
        window.localStorage,
      );
      const originalGetItem = window.localStorage.getItem.bind(
        window.localStorage,
      );
      window.localStorage.setItem = (key: string, value: string) => {
        storage[key] = String(value);
        return originalSetItem(key, value);
      };
      window.localStorage.getItem = (key: string) => {
        if (key in storage) return storage[key];
        return originalGetItem(key);
      };

      // Directly seed the real localStorage as well so the patch above is
      // redundant in case the app reads before our override is applied.
      for (const [key, value] of Object.entries(storage)) {
        window.localStorage.setItem(key, value);
      }
    },
    { providerKey, user, token: AUTH_TOKEN },
  );
}