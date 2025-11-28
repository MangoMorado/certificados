<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Eliminar posiciones relacionadas primero
        DB::table('certificate_positions')->delete();
        
        // Eliminar templates existentes (que son SVG)
        DB::table('certificate_templates')->delete();
        
        // Modificar la columna file_type
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->dropColumn('file_type');
        });
        
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->enum('file_type', ['png', 'jpg', 'jpeg'])->default('png')->after('file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->dropColumn('file_type');
        });
        
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->enum('file_type', ['svg', 'pdf'])->default('svg')->after('file_path');
        });
    }
};
