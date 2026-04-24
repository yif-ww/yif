/*
  Warnings:

  - A unique constraint covering the columns `[userId,cycle]` on the table `scholarship_application` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "scholarship_application_userId_cycle_key" ON "scholarship_application"("userId", "cycle");
