<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gallery_images', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nombre identificador (ej: "valiente", "creativo")
            $table->string('original_name'); // Nombre original del archivo
            $table->string('file_path'); // Ruta del archivo
            $table->string('file_type'); // Tipo de archivo (png, jpg, etc.)
            $table->integer('width')->nullable(); // Ancho de la imagen
            $table->integer('height')->nullable(); // Alto de la imagen
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gallery_images');
    }
};

