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
        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->boolean('enabled')->default(true)->after('center_automatically');
        });
        
        // Establecer enabled = true para todos los registros existentes
        DB::table('certificate_positions')->update(['enabled' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->dropColumn('enabled');
        });
    }
};
