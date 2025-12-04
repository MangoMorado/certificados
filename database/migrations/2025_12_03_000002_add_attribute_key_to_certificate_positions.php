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
        Schema::table('certificate_positions', function (Blueprint $table) {
            // Campo para vincular labels con atributos dinámicos de personas
            $table->string('attribute_key')->nullable()->after('label_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->dropColumn('attribute_key');
        });
    }
};

