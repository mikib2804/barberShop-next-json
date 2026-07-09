import { createAppointmentInDb } from "@/lib/db";
import { sendAppointmentEmail } from "@/lib/mail";

export async function POST(request: Request) {
  const payload = await request.json();
  if (
    !payload.name ||
    !payload.phone ||
    !payload.email ||
    !payload.date ||
    !payload.time
  ) {
    return Response.json(
      { error: "name, phone, email, date and time are required" },
      { status: 400 },
    );
  }

  try {
    const appointment = await createAppointmentInDb(payload);
    sendAppointmentEmail(appointment).catch((error) => {
      console.error("Could not send appointment email", error);
    });
    return Response.json(appointment, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create appointment",
      },
      { status: 409 },
    );
  }
}
