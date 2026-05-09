<?php

class CloudinaryService
{
    private static array $TIPOS_PERMITIDOS = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    private static int $MAX_BYTES = 5242880; // 5MB

    public static function validar(array $archivo): void
    {
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException('Error al recibir el archivo');
        }

        if ($archivo['size'] > self::$MAX_BYTES) {
            throw new \InvalidArgumentException('La imagen no puede superar 5MB');
        }

        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeReal = finfo_file($finfo, $archivo['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeReal, self::$TIPOS_PERMITIDOS, true)) {
            throw new \InvalidArgumentException('Solo se permiten imágenes JPG, PNG, GIF o WEBP');
        }
    }

    public static function subir(string $rutaTmp, string $carpeta, string $publicId): string
    {
        $cloud  = Config::$CLOUDINARY_CLOUD;
        $key    = Config::$CLOUDINARY_KEY;
        $secret = Config::$CLOUDINARY_SECRET;

        $timestamp = time();

        $params = [
            'folder'    => $carpeta,
            'overwrite' => 'true',
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ];
        ksort($params);

        $partes = [];
        foreach ($params as $clave => $valor) {
            $partes[] = $clave . '=' . $valor;
        }
        $cadena    = implode('&', $partes) . $secret;
        $signature = sha1($cadena);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => "https://api.cloudinary.com/v1_1/{$cloud}/image/upload",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => [
                'file'      => new CURLFile($rutaTmp),
                'api_key'   => $key,
                'timestamp' => $timestamp,
                'folder'    => $carpeta,
                'overwrite' => 'true',
                'public_id' => $publicId,
                'signature' => $signature,
            ],
        ]);

        $respuesta = curl_exec($ch);
        $errorCurl = curl_error($ch);
        curl_close($ch);

        if ($errorCurl) {
            throw new \RuntimeException('Error al conectar con Cloudinary: ' . $errorCurl);
        }

        $datos = json_decode($respuesta, true);

        if (isset($datos['error'])) {
            throw new \RuntimeException('Cloudinary: ' . $datos['error']['message']);
        }

        return $datos['secure_url'];
    }
}
