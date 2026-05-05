"use client";

import { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "ink-mobile-5ee6a.firebaseapp.com",
  projectId: "ink-mobile-5ee6a",
  storageBucket: "ink-mobile-5ee6a.appspot.com",
  messagingSenderId: "174258192559",
  appId: "1:174258192559:web:811e204b406c68199c945a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({});
  const [image, setImage] = useState(null);

  const canvasRef = useRef(null);
  const printRef = useRef(null);

  // 🔥 Cargar datos
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 🖊️ Firma
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let drawing = false;

    const start = (e) => {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const draw = (e) => {
      if (!drawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    const stop = () => (drawing = false);

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
    };
  }, []);

  // 📸 Convertir imagen a base64 (SOLUCIÓN ERROR)
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 💾 Guardar
  const saveOrder = async () => {
    try {
      await addDoc(collection(db, "orders"), {
        ...form,
        estado: "Recibido",
        fecha: new Date().toLocaleString(),
        firma: canvasRef.current.toDataURL(),
        imagen: image || null,
      });

      printOrder();

      setForm({});
      setImage(null);
    } catch (err) {
      alert("Error al guardar");
      console.log(err);
    }
  };

  // 🖨️ Imprimir SOLO orden
  const printOrder = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "", "width=800,height=600");

    win.document.write(`
      <html>
        <head>
          <title>Orden</title>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  // ❌ Eliminar
  const remove = async (id) => {
    await deleteDoc(doc(db, "orders", id));
  };

  // 📲 WhatsApp
  const sendWhatsApp = (o) => {
    const msg = `Orden ${o.nombre} - ${o.dispositivo} - ${o.problema}`;
    window.open(`https://wa.me/34${o.telefono}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🔧 Ink-Mobile PRO</h1>

      {/* FORM */}
      <input placeholder="Nombre" onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <input placeholder="DNI" onChange={(e) => setForm({ ...form, dni: e.target.value })} />
      <input placeholder="Teléfono" onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
      <input placeholder="Dispositivo" onChange={(e) => setForm({ ...form, dispositivo: e.target.value })} />
      <input placeholder="Problema" onChange={(e) => setForm({ ...form, problema: e.target.value })} />
      <input placeholder="Precio" onChange={(e) => setForm({ ...form, precio: e.target.value })} />

      <input type="file" onChange={handleImage} />

      <canvas ref={canvasRef} width={300} height={150} style={{ border: "1px solid black" }} />

      <button onClick={saveOrder}>Guardar + imprimir</button>

      {/* PRINT AREA */}
      <div ref={printRef} style={{ display: "none" }}>
        <h2>Ink-Mobile</h2>
        <p>{form.nombre}</p>
        <p>{form.dispositivo}</p>
        <p>{form.problema}</p>

        {image && <img src={image} width={200} />}

        <img src={canvasRef.current?.toDataURL()} width={200} />
      </div>

      {/* COLUMNAS */}
      <div style={{ display: "flex", gap: 20, marginTop: 30 }}>
        {["Recibido", "Pendiente", "Recambio", "Finalizado"].map((estado) => (
          <div key={estado} style={{ flex: 1 }}>
            <h3>{estado}</h3>

            {orders
              .filter((o) => o.estado === estado)
              .map((o) => (
                <div key={o.id}>
                  #{o.id}
                  <br />
                  {o.nombre}
                  <br />
                  <button onClick={() => sendWhatsApp(o)}>WhatsApp</button>
                  <button onClick={() => remove(o.id)}>Eliminar</button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
