"use client";

import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQUkrs1QJFmbrAQqt_dRLmgHfU3Zp-c2Y",
  authDomain: "ink-mobile-5ee6a.firebaseapp.com",
  projectId: "ink-mobile-5ee6a",
  storageBucket: "ink-mobile-5ee6a.appspot.com",
  messagingSenderId: "174258192559",
  appId: "1:174258192559:web:811e204b40c6c8199c945a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export default function Page() {
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  // 🔄 cargar datos
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snapshot) => {
      setOrdenes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✍️ firma táctil
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const start = (e) => {
      drawing.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!drawing.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stop = () => (drawing.current = false);

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stop);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw);
    window.addEventListener("touchend", stop);
  }, []);

  // 💾 guardar + imprimir (SOLUCIÓN DEFINITIVA)
  const guardar = async () => {
    try {
      // 🔥 abrir ventana primero (clave anti-bloqueo)
      const w = window.open("", "_blank");

      if (!w) {
        alert("Activa ventanas emergentes en el navegador");
        return;
      }

      if (!form.nombre || !form.telefono) {
        alert("Faltan datos");
        return;
      }

      let fotoURL = "";

      if (file) {
        const storageRef = ref(storage, "ordenes/" + Date.now());
        await uploadBytes(storageRef, file);
        fotoURL = await getDownloadURL(storageRef);
      }

      const firma = canvasRef.current.toDataURL();
      const ahora = new Date();

      const nueva = {
        ...form,
        foto: fotoURL,
        firma,
        fecha: ahora.toLocaleDateString(),
        hora: ahora.toLocaleTimeString(),
        numero: Date.now(),
        estado: "Recibido",
      };

      await addDoc(collection(db, "ordenes"), nueva);

      // 🖨 imprimir
      w.document.write(`
        <html>
        <body style="font-family:Arial;padding:20px">
          <h2>Ink-Mobile</h2>
          <p>CIF: E56261365</p>
          <p>Calle Cruz Verde Nº22</p>
          <p>Tel: 600 639 228</p>
          <hr/>

          <h3>Orden #${nueva.numero}</h3>
          <p>${nueva.fecha} - ${nueva.hora}</p>

          <p><b>Nombre:</b> ${nueva.nombre}</p>
          <p><b>DNI:</b> ${nueva.dni || ""}</p>
          <p><b>Teléfono:</b> ${nueva.telefono}</p>
          <p><b>Dispositivo:</b> ${nueva.dispositivo}</p>
          <p><b>Problema:</b> ${nueva.problema}</p>
          <p><b>Presupuesto:</b> ${nueva.presupuesto}€</p>

          <hr/>
          <p><b>Firma:</b></p>
          <img src="${nueva.firma}" width="200"/>

          ${
            nueva.foto
              ? `<p><b>Estado:</b></p><img src="${nueva.foto}" width="200"/>`
              : ""
          }

          <script>
            window.onload = () => window.print();
          </script>
        </body>
        </html>
      `);

      w.document.close();

      alert("Guardado correctamente");

      // limpiar
      setForm({});
      setFile(null);

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 300, 120);

    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🔧 Ink-Mobile</h1>

      <div style={{ background: "#eee", padding: 20 }}>
        <input placeholder="Nombre" onChange={e=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="DNI" onChange={e=>setForm({...form,dni:e.target.value})}/>
        <input placeholder="Teléfono" onChange={e=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" onChange={e=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" onChange={e=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="Presupuesto" onChange={e=>setForm({...form,presupuesto:e.target.value})}/>

        <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>

        <br/><br/>

        <canvas
          ref={canvasRef}
          width={300}
          height={120}
          style={{ border:"2px solid black", touchAction:"none" }}
        />

        <br/><br/>

        <button onClick={guardar}>
          Guardar + imprimir
        </button>
      </div>
    </div>
  );
}
