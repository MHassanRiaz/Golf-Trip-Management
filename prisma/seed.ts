import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create sample users
  const hashedPassword = await bcrypt.hash("password123", 10)

  const user1 = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
      ghinNumber: "12345678",
      handicapIndex: 15.4,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      password: hashedPassword,
      name: "John Doe",
      ghinNumber: "87654321",
      handicapIndex: 10.2,
    },
  })

  console.log("✅ Created users:", { user1, user2 })

  // Create sample trip
  const trip = await prisma.trip.create({
    data: {
      name: "Myrtle Beach Golf Trip 2024",
      location: "Myrtle Beach, SC",
      startDate: new Date("2024-06-15"),
      endDate: new Date("2024-06-18"),
      description: "Annual golf trip with the boys",
      organizerId: user1.id,
    },
  })

  console.log("✅ Created trip:", trip)

  // Create teams
  const team1 = await prisma.team.create({
    data: {
      tripId: trip.id,
      name: "Eagles",
      color: "#3b82f6",
    },
  })

  const team2 = await prisma.team.create({
    data: {
      tripId: trip.id,
      name: "Birdies",
      color: "#10b981",
    },
  })

  console.log("✅ Created teams:", { team1, team2 })

  // Create participants
  const participant1 = await prisma.participant.create({
    data: {
      tripId: trip.id,
      teamId: team1.id,
      userId: user1.id,
      name: user1.name,
      ghinNumber: user1.ghinNumber,
      handicapIndex: user1.handicapIndex,
      email: user1.email,
    },
  })

  const participant2 = await prisma.participant.create({
    data: {
      tripId: trip.id,
      teamId: team1.id,
      name: "Mike Smith",
      handicapIndex: 18.5,
    },
  })

  const participant3 = await prisma.participant.create({
    data: {
      tripId: trip.id,
      teamId: team2.id,
      userId: user2.id,
      name: user2.name,
      ghinNumber: user2.ghinNumber,
      handicapIndex: user2.handicapIndex,
      email: user2.email,
    },
  })

  const participant4 = await prisma.participant.create({
    data: {
      tripId: trip.id,
      teamId: team2.id,
      name: "Tom Johnson",
      handicapIndex: 12.8,
    },
  })

  console.log("✅ Created participants:", {
    participant1,
    participant2,
    participant3,
    participant4,
  })

  console.log("🎉 Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
