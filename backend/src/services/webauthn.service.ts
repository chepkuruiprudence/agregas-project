// // backend/src/services/webauthn.service.ts

// import {
//   generateRegistrationOptions,
//   verifyRegistrationResponse,
//   generateAuthenticationOptions,
//   verifyAuthenticationResponse,
//   isoBase64URL,
// } from "@simplewebauthn/server";
// import { RegistrationResponseJSON, AuthenticationResponseJSON } from "@simplewebauthn/types";

// export class WebAuthnService {
//   // Expected origin (where your website runs)
//   private rpID = process.env.WEBAUTHN_RP_ID || "localhost";
//   private origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:5173";
//   private rpName = "AGREGAS";

//   /**
//    * Step 1: Generate registration options (for adding passkey)
//    */
//   async generateRegistrationOptions(userId: string, userName: string) {
//     try {
//       console.log(`🔐 [WEBAUTHN] Generating registration options for user: ${userName}`);

//       const options = await generateRegistrationOptions({
//         rpID: this.rpID,
//         rpName: this.rpName,
//         userID: isoBase64URL.fromBuffer(Buffer.from(userId)),
//         userName: userName,
//         userDisplayName: userName,
//         attestationType: "direct",
//         // Only allow platform authenticators (built-in biometrics)
//         authenticatorSelection: {
//           authenticatorAttachment: "platform",
//           residentKey: "preferred",
//           userVerification: "preferred",
//         },
//         timeout: 60000, // 60 seconds
//         supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
//       });

//       console.log(`✓ Registration options generated`);
//       return options;
//     } catch (error) {
//       console.error("❌ Failed to generate registration options:", error);
//       throw error;
//     }
//   }

//   /**
//    * Step 2: Verify registration response (user completed biometric)
//    */
//   async verifyRegistration(
//     userId: string,
//     registrationResponse: RegistrationResponseJSON,
//     expectedChallenge: string
//   ) {
//     try {
//       console.log(`🔐 [WEBAUTHN] Verifying registration response`);

//       const verification = await verifyRegistrationResponse({
//         response: registrationResponse,
//         expectedChallenge: expectedChallenge,
//         expectedOrigin: this.origin,
//         expectedRPID: this.rpID,
//       });

//       console.log(`✓ Registration verified`);

//       return {
//         verified: verification.verified,
//         credentialID: verification.registrationInfo?.credentialID,
//         publicKey: verification.registrationInfo?.credentialPublicKey,
//         counter: verification.registrationInfo?.counter || 0,
//       };
//     } catch (error) {
//       console.error("❌ Registration verification failed:", error);
//       throw error;
//     }
//   }

//   /**
//    * Step 3: Generate authentication options (for login)
//    */
//   async generateAuthenticationOptions(userId?: string) {
//     try {
//       console.log(`🔐 [WEBAUTHN] Generating authentication options`);

//       const options = await generateAuthenticationOptions({
//         rpID: this.rpID,
//         timeout: 60000, // 60 seconds
//         userVerification: "preferred",
//       });

//       console.log(`✓ Authentication options generated`);
//       return options;
//     } catch (error) {
//       console.error("❌ Failed to generate authentication options:", error);
//       throw error;
//     }
//   }

//   /**
//    * Step 4: Verify authentication response (user logged in with biometric)
//    */
//   async verifyAuthentication(
//     authenticationResponse: AuthenticationResponseJSON,
//     expectedChallenge: string,
//     storedPublicKey: Buffer,
//     storedCounter: number
//   ) {
//     try {
//       console.log(`🔐 [WEBAUTHN] Verifying authentication response`);

//       const verification = await verifyAuthenticationResponse({
//         response: authenticationResponse,
//         expectedChallenge: expectedChallenge,
//         expectedOrigin: this.origin,
//         expectedRPID: this.rpID,
//         credential: {
//           id: authenticationResponse.id,
//           publicKey: storedPublicKey,
//           counter: storedCounter,
//           transports: authenticationResponse.response.transports,
//         },
//       });

//       console.log(`✓ Authentication verified`);

//       return {
//         verified: verification.verified,
//         newCounter: verification.authenticationInfo?.newCounter || storedCounter,
//       };
//     } catch (error) {
//       console.error("❌ Authentication verification failed:", error);
//       throw error;
//     }
//   }
// }

// export const webAuthnService = new WebAuthnService();