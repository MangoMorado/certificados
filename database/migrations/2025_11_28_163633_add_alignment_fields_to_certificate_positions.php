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
            $table->enum('text_align_horizontal', ['left', 'center', 'right'])->default('center')->after('font_color');
            $table->enum('text_align_vertical', ['top', 'middle', 'bottom'])->default('middle')->after('text_align_horizontal');
            $table->boolean('center_automatically')->default(true)->after('text_align_vertical');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->dropColumn(['text_align_horizontal', 'text_align_vertical', 'center_automatically']);
        });
    }
};
