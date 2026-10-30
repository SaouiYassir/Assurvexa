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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->date('date_debut'); // date_debut: Date
            $table->date('date_fin'); // date_fin: Date[cite: 3]
            $table->string('status'); // status: String[cite: 3]
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade'); // Subscribes relation[cite: 3]
            $table->foreignId('policy_id')->constrained('policies')->onDelete('cascade'); // Covers relation[cite: 3]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
