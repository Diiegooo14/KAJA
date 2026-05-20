<?php

class CloudinaryService
{
    // Genera una URL de descarga autenticada usando la API Admin de Cloudinary.
    // Usa el mismo formato de firma que la subida (SHA1 hex), evitando los problemas
    // del firmado de URLs de entrega con Strict Mode.
    public static function urlDescargaApi(string $urlAlmacenada): string
    {
        $cloud     = Config::$CLOUDINARY_CLOUD;
        $key       = Config::$CLOUDINARY_KEY;
        $secret    = Config::$CLOUDINARY_SECRET;
        $timestamp = time();

        // Limpiar URL: quitar query string y firma de entrega existente
        $limpia = urldecode(preg_replace('/\?.*$/', '', $urlAlmacenada));
        $limpia = preg_replace('#/s--[^/]+--/#', '/', $limpia);

        // Extraer public_id completo (con carpeta), ignorando la versión
        if (!preg_match('#/upload/(?:v\d+/)?(.+)$#', $limpia, $m)) {
            throw new \RuntimeException('No se pudo extraer el public_id de la URL');
        }

        $publicId = $m[1]; // "nominas KAJA/nomina_1_2026_5.pdf"

        // Firma con el mismo algoritmo que la subida (SHA1 hex de params ordenados + secret)
        $params = [
            'public_id' => $publicId,
            'timestamp' => $timestamp,
            'type'      => 'upload',
        ];
        ksort($params);

        $partes = [];
        foreach ($params as $k => $v) {
            $partes[] = "{$k}={$v}";
        }
        $signature = sha1(implode('&', $partes) . $secret);

        return 'https://api.cloudinary.com/v1_1/' . $cloud . '/raw/download?' . http_build_query([
            'public_id' => $publicId,
            'api_key'   => $key,
            'timestamp' => $timestamp,
            'signature' => $signature,
            'type'      => 'upload',
        ]);
    }

    private static array $TIPOS_PERMITIDOS = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    private static int $MAX_BYTES      = 5242880;  // 5 MB
    private static int $MAX_BYTES_PDF  = 10485760; // 10 MB

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

    public static function validarPdf(array $archivo): void
    {
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException('Error al recibir el archivo');
        }

        if ($archivo['size'] > self::$MAX_BYTES_PDF) {
            throw new \InvalidArgumentException('El PDF no puede superar 10MB');
        }

        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeReal = finfo_file($finfo, $archivo['tmp_name']);
        finfo_close($finfo);

        if ($mimeReal !== 'application/pdf') {
            throw new \InvalidArgumentException('Solo se permiten archivos PDF');
        }
    }

    public static function subirPdf(string $rutaTmp, string $carpeta, string $publicId): string
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
            CURLOPT_URL            => "https://api.cloudinary.com/v1_1/{$cloud}/raw/upload",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => [
                'file'          => new CURLFile($rutaTmp, 'application/pdf'),
                'api_key'       => $key,
                'timestamp'     => $timestamp,
                'folder'        => $carpeta,
                'overwrite'     => 'true',
                'public_id'     => $publicId,
                'resource_type' => 'raw',
                'signature'     => $signature,
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
