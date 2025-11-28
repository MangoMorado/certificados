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
        Schema::create('certificate_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('certificate_template_id')->constrained()->onDelete('cascade');
            $table->enum('field_type', ['name', 'cedula']);
            $table->decimal('x', 10, 2)->default(0);
            $table->decimal('y', 10, 2)->default(0);
            $table->integer('font_size')->default(16);
            $table->string('font_family')->default('Arial');
            $table->string('font_color')->default('#000000');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_positions');
    }
};
