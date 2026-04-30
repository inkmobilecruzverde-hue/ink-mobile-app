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
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snapshot) => {
      setOrdenes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // ✍️ FIRMA FUNCIONAL
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

    const stop = () => {
      drawing.current = false;
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stop);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw);
    window.addEventListener("touchend", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      window.removeEventListener("mouseup", stop);

      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  const imprimirTicket = (o) => {
    const w = window.open("", "_blank");

    w.document.write(`
      <h2>Ink-Mobile</h2>
      <p>CIF: E56261365</p>
      <p>Calle Cruz Verde Nº22</p>
      <p>Tel: 600 639 228</p>
      <hr/>

      <h3>Orden #${o.numero}</h3>
      <p>${o.fecha} - ${o.hora}</p>

      <p><b>Cliente:</b> ${o.nombre}</p>
      <p><b>Teléfono:</b> ${o.telefono}</p>
      <p><b>Dispositivo:</b> ${o.dispositivo}</p>
      <p><b>Problema:</b> ${o.problema}</p>
      <p><b>Presupuesto:</b> ${o.presupuesto}€</p>

      <hr/>

      <p><b>Firma:</b></p>
      <img src="${o.firma}" width="200"/>

      ${
        o.foto
          ? `<p><b>Estado del dispositivo:</b></p>
             <img src="${o.foto}" width="200"/>`
          : ""
      }

      <script>
        window.onload = () => window.print();
      </script>
    `);

    w.document.close();
  };

  const guardar = async () => {
    try {
      if (!form.nombre || !form.telefono) {
        alert("Faltan datos");
        return;
      }

      let fotoURL = form.foto || "";

      if (file) {
        const storageRef = ref(storage, "ordenes/" + Date.now());
        await uploadBytes(storageRef, file);
        fotoURL = await getDownloadURL(storageRef);
      }

      const firma = canvasRef.current.toDataURL();
      const ahora = new Date();

      const data = {
        ...form,
        foto: fotoURL,
        firma,
        fecha: ahora.toLocaleDateString(),
        hora: ahora.toLocaleTimeString(),
      };

      let ordenFinal;

      if (editId) {
        await updateDoc(doc(db, "ordenes", editId), data);
        ordenFinal = { ...data, numero: form.numero };
        setEditId(null);
      } else {
        const numero = Date.now();
        ordenFinal = { ...data, numero };

        await addDoc(collection(db, "ordenes"), {
          ...ordenFinal,
          estado: "Recibido",
        });
      }

      setForm({});
      setFile(null);

      // limpiar firma
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      alert("Orden guardada");

      setTimeout(() => imprimirTicket(ordenFinal), 300);

    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
  };

  const editar = (o) => {
    setForm(o);
    setEditId(o.id);
  };

  const eliminar = async (id) => {
    if (confirm("¿Eliminar esta orden?")) {
      await deleteDoc(doc(db, "ordenes", id));
    }
  };

  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
  };

  const enviarWhatsApp = (o) => {
    const mensaje = `📱 Ink-Mobile

Orden #${o.numero}
Cliente: ${o.nombre}
Dispositivo: ${o.dispositivo}
Estado: ${o.estado}
Problema: ${o.problema}`;

    window.open(`https://wa.me/34${o.telefono}?text=${encodeURIComponent(mensaje)}`);
  };

  const columnas = ["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"];

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 Ink-Mobile</h1>

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20 }}>
        <input placeholder="Nombre" value={form.nombre || ""} onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="Teléfono" value={form.telefono || ""} onChange={(e)=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" value={form.dispositivo || ""} onChange={(e)=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" value={form.problema || ""} onChange={(e)=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="€" value={form.presupuesto || ""} onChange={(e)=>setForm({...form,presupuesto:e.target.value})}/>
        <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>

        <canvas ref={canvasRef} width={300} height={120} style={{ border:"2px solid black", touchAction:"none" }} />

        <button onClick={()=> {
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0,0,300,120);
        }}>Limpiar firma</button>

        <br/><br/>

        <button onClick={guardar}>
          {editId ? "Actualizar + imprimir" : "Guardar + imprimir"}
        </button>
      </div>

      {/* COLUMNAS */}
      <div style={{ display: "flex", gap: 20, marginTop:20 }}>
        {columnas.map(col => (
          <div key={col} style={{ flex: 1, background: "#f5f5f5", padding: 10 }}>
            <h3>{col}</h3>

            {ordenes.filter(o => o.estado === col).map(o => (
              <div key={o.id} style={{ background:"white", marginBottom:10, padding:10 }}>
                <b>#{o.numero}</b><br/>
                {o.nombre}<br/>
                {o.dispositivo}

                <br/><br/>

                <button onClick={()=>setOrdenSeleccionada(o)}>Ver</button>
                <button onClick={()=>editar(o)}>Editar</button>
                <button onClick={()=>eliminar(o.id)}>Eliminar</button>
                <button onClick={()=>enviarWhatsApp(o)}>WhatsApp</button>

                <br/><br/>

                <select value={o.estado} onChange={(e)=>cambiarEstado(o.id,e.target.value)}>
                  {columnas.map(c=> <option key={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* DETALLE */}
      {ordenSeleccionada && (
        <div style={{ position:"fixed", top:0,left:0,width:"100%",height:"100%", background:"rgba(0,0,0,0.6)" }}>
          <div style={{ background:"white", padding:20, margin:"5% auto", width:400 }}>
            <h3>Orden #{ordenSeleccionada.numero}</h3>

            <p>{ordenSeleccionada.nombre}</p>
            <p>{ordenSeleccionada.telefono}</p>
            <p>{ordenSeleccionada.dispositivo}</p>
            <p>{ordenSeleccionada.problema}</p>

            {ordenSeleccionada.foto && <img src={ordenSeleccionada.foto} width="100%" />}
            <img src={ordenSeleccionada.firma} width="100%" />

            <br/>

            <button onClick={()=>imprimirTicket(ordenSeleccionada)}>Imprimir</button>
            <button onClick={()=>setOrdenSeleccionada(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
