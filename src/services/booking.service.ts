import { BookingRequest } from "../dto";
import { sendEmail } from "../utils";

const sessionTypeMap = {
  individual: "Індивідуальна зйомка",
  group: "Групова зйомка",
  express: "Експрес зйомка",
  "love-story": "Love Story",
};

const createBooking = async (data: BookingRequest) => {
  const subject = `Новий запит на фотосесію від ${data.name}`;
  const sessionTypeUkrainian = sessionTypeMap[data.sessionType] || data.sessionType;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        .details { margin: 20px 0; }
        .detail-item { margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📸 Новий запит на фотосесію</h2>
        </div>

        <div class="details">
          <div class="detail-item">
            <span class="label">👤 <b>Ім'я:</b></span> ${data.name}
          </div>
          <div class="detail-item">
            <span class="label">📱 <b>Контакт:</b></span> ${data.contact}
          </div>
          <div class="detail-item">
            <span class="label">🎯 <b>Тип сесії:</b></span> ${sessionTypeUkrainian}
          </div>
          ${
            data.comment
              ? `
          <div class="detail-item">
            <span class="label">❓ <b>Запитання:</b></span> ${data.comment}
          </div>
          `
              : ""
          }
          ${
            data.sessionDate
              ? `
          <div class="detail-item">
            <span class="label">⏰ <b>Бажаний час:</b></span> ${data.sessionDate}
          </div>
          `
              : ""
          }
          <div class="detail-item">
            <span class="label">📅 <b>Дата запиту:</b></span> ${new Date().toLocaleString("uk-UA")}
          </div>
        </div>

        <div class="footer">
          <p>Цей запит було надіслано через форму зворотного зв'язку на сайті.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: process.env.ADMIN_EMAIL!,
    subject,
    html,
  });
};

export default {
  createBooking,
};
