<?php

namespace App\Services;

use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

class FirebaseAuthService
{
    protected FirebaseAuth $auth;

    public function __construct(FirebaseAuth $auth)
    {
        $this->auth = $auth;
    }

    /**
     * Verify a Firebase ID token and return the decoded claims.
     *
     * @param string $idToken
     * @return array [uid, phone, email, name, picture]
     * @throws \Exception
     */
    public function verifyIdToken(string $idToken): array
    {
        try {
            $verifiedToken = $this->auth->verifyIdToken($idToken);
            $claims = $verifiedToken->claims();

            return [
                'uid' => $claims->get('sub'),
                'phone' => $claims->get('phone_number'),
                'email' => $claims->get('email'),
                'name' => $claims->get('name'),
                'picture' => $claims->get('picture'),
            ];
        } catch (FailedToVerifyToken $e) {
            throw new \Exception('Invalid Firebase token: ' . $e->getMessage());
        }
    }

    /**
     * Get a Firebase user by UID.
     */
    public function getUser(string $uid): array
    {
        $user = $this->auth->getUser($uid);

        return [
            'uid' => $user->uid,
            'phone' => $user->phoneNumber,
            'email' => $user->email,
            'name' => $user->displayName,
            'picture' => $user->photoUrl,
        ];
    }
}
