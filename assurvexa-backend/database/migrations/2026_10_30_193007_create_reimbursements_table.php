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
        Schema::create('reimbursements', function (Blueprint $table) {
            $table->id();
            $table->float('amount'); // amount: Float[cite: 3]
            $table->string('paymentMethod'); // PaymentMethod enum[cite: 3]
            $table->string('paymentStatus'); // PaymentStatus enum[cite: 3]
            $table->string('reference')->unique(); // reference: String[cite: 3]
            $table->date('paymentDate')->nullable(); // paymentDate: Date[cite: 3]
            $table->foreignId('claim_id')->constrained('claims')->onDelete('cascade'); // reimbursed by relation (1 to 1)[cite: 3]
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reimbursements');
    }
};
