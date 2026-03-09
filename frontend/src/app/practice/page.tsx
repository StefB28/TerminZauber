'use client'

export default function PracticePage() {
  const slots = ["09:00", "09:30", "10:00", "11:30", "14:00"]

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-[#6a5acd]">
        Praxisname – Termine
      </h1>

      <h2 className="text-xl mb-4">Verfügbare Termine</h2>

      <div className="grid grid-cols-3 gap-4">
        {slots.map((slot) => (
          <button
            key={slot}
            className="border rounded-lg py-3 hover:bg-[#6a5acd] hover:text-white transition"
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  )
}
