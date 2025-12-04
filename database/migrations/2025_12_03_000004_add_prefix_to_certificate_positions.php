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
            $table->string('prefix')->nullable()->after('attribute_key');
            $table->integer('prefix_font_size')->nullable()->after('prefix');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->dropColumn(['prefix', 'prefix_font_size']);
        });
    }
};

