"use client";

import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

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
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [ordenImprimir, setOrdenImprimir] = useState(null);
  const canvasRef = useRef(null);

  // ✍️ FIRMA FUNCIONAL
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let drawing = false;

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
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stop = () => (drawing = false);

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stop);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw);
    window.addEventListener("touchend", stop);
  }, []);

  const guardar = async () => {
    try {
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
      };

      await addDoc(collection(db, "ordenes"), nueva);

      // 👉 guardamos para imprimir
      setOrdenImprimir(nueva);

      setTimeout(() => {
        window.print();
      }, 200);

      // limpiar
      setForm({});
      setFile(null);
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 300, 120);

    } catch (e) {
      console.error(e);
      alert("Error");
    }
  };

  return (
    <div style={{ padding: 20 }}>

      <h1>🔧 Ink-Mobile</h1>

      {/* FORM */}
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

      {/* 🖨 ZONA SOLO PARA IMPRESIÓN */}
      {ordenImprimir && (
        <div className="print">
          <h2>Ink-Mobile</h2>
          <p>CIF: E56261365</p>
          <p>Calle Cruz Verde Nº22</p>
          <p>Tel: 600 639 228</p>
          <hr/>

          <h3>Orden #{ordenImprimir.numero}</h3>
          <p>{ordenImprimir.fecha} - {ordenImprimir.hora}</p>

          <p>{ordenImprimir.nombre}</p>
          <p>{ordenImprimir.dni}</p>
          <p>{ordenImprimir.telefono}</p>
          <p>{ordenImprimir.dispositivo}</p>
          <p>{ordenImprimir.problema}</p>
          <p>{ordenImprimir.presupuesto}€</p>

          <img src={ordenImprimir.firma} width="200"/>

          {ordenImprimir.foto && (
            <img src={ordenImprimir.foto} width="200"/>
          )}
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print, .print * {
            visibility: visible;
          }
          .print {
            position: absolute;
            top: 0;
            left: 0;
          }
        }
      `}</style>

    </div>
  );
}
