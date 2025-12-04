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
        // Primero, agregar la columna label_text
        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->string('label_text')->nullable()->after('field_type');
        });

        // Cambiar el enum field_type para incluir 'label'
        // En SQLite no podemos modificar enums directamente, así que usamos un approach diferente
        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->string('field_type_new')->default('name')->after('field_type');
        });

        // Copiar los datos
        DB::table('certificate_positions')->update([
            'field_type_new' => DB::raw('field_type')
        ]);

        // Eliminar la columna vieja y renombrar la nueva
        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->dropColumn('field_type');
        });

        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->renameColumn('field_type_new', 'field_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar labels existentes
        DB::table('certificate_positions')->where('field_type', 'label')->delete();

        Schema::table('certificate_positions', function (Blueprint $table) {
            $table->dropColumn('label_text');
        });
    }
};

