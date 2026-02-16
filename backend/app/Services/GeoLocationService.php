<?php

namespace App\Services;

use Stevebauman\Location\Facades\Location;

class GeoLocationService
{
    /**
     * Get geo location from IP address.
     */
    public function getLocation(?string $ip = null): ?array
    {
        try {
            $location = Location::get($ip ?? request()->ip());

            if (!$location) {
                return null;
            }

            return [
                'country' => $location->countryName,
                'country_code' => $location->countryCode,
                'city' => $location->cityName,
                'region' => $location->regionName,
                'latitude' => $location->latitude,
                'longitude' => $location->longitude,
                'timezone' => $location->timezone,
                'postal_code' => $location->postalCode,
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }
}
