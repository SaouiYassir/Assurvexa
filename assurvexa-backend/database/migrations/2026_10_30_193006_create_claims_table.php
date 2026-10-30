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
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->date('incident_date'); // incident_date: Date[cite: 3]
            $table->text('description'); // description: String[cite: 3]
            $table->integer('estimated_amount'); // estimated_amount: Int[cite: 3]
            $table->string('status'); // status: ClaimStatus enum[cite: 3]
            $table->text('decision_note')->nullable(); // decision_note: String[cite: 3]
            $table->date('review_date')->nullable(); // review_date: Date[cite: 3]
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade'); // Concerns relation[cite: 3]
            $table->foreignId('agent_id')->nullable()->constrained('agents')->onDelete('set null'); // Processes relation (0..1)[cite: 3]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claims');
    }
};
