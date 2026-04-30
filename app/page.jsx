"use client";

import { useState, useEffect } from "react";

// 🔥 FIREBASE
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQUkrs1QJFmbrAQqt_dRLmgHfU3Zp-c2Y",
  authDomain: "ink-mobile-5ee6a.firebaseapp.com",
  projectId: "ink-mobile-5ee6a",
  storageBucket: "ink-mobile-5ee6a.appspot.com",
  messagingSenderId: "174258192559",
  appId: "1:174258192559:web:811e20b40c6c8199c945a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    dispositivo: "",
    codigo: "",
    problema: "",
    notas: "",
    presupuesto: ""
  });

  // 🔢 Nº ORDEN AUTO
  const generarNumero = () => Date.now();

  // 📅 FECHA AUTO
  const fechaHoy = () => new Date().toISOString().split("T")[0];

  // 📥 CARGAR DATOS
  const cargarOrdenes = async () => {
    const snapshot = await getDocs(collection(db, "ordenes"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setOrdenes(data);
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  // 💾 GUARDAR
  const guardarOrden = async () => {
    const nueva = {
      ...form,
      numero: generarNumero(),
      fecha: fechaHoy(),
      estado: "Recibido"
    };

    await addDoc(collection(db, "ordenes"), nueva);
    cargarOrdenes();

    imprimirTicket(nueva);

    setForm({
      nombre: "",
      dni: "",
      telefono: "",
      dispositivo: "",
      codigo: "",
      problema: "",
      notas: "",
      presupuesto: ""
    });
  };

  // 🧾 IMPRIMIR
  const imprimirTicket = (orden) => {
    const ventana = window.open("", "_blank");

    ventana.document.write(`
      <h2>Ink-Mobile</h2>
      <p>CIF: E56261365</p>
      <p>Calle Cruz Verde Nº22</p>
      <p>Tel: 600 639 228</p>
      <hr/>
      <p><b>Nº:</b> ${orden.numero}</p>
      <p><b>Fecha:</b> ${orden.fecha}</p>
      <p><b>Cliente:</b> ${orden.nombre}</p>
      <p><b>Teléfono:</b> ${orden.telefono}</p>
      <p><b>Dispositivo:</b> ${orden.dispositivo}</p>
      <p><b>Problema:</b> ${orden.problema}</p>
      <p><b>Presupuesto:</b> ${orden.presupuesto}€</p>
    `);

    ventana.print();
  };

  // 🔍 FILTRO
  const filtradas = ordenes.filter(o =>
    o.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.telefono?.includes(busqueda)
  );

  // 🎨 ESTILO
  const card = {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  };

  return (
    <div style={{ padding: 20, background: "#f5f5f5", minHeight: "100vh" }}>

      <h1>🔧 Ink-Mobile</h1>

      {/* FORM */}
      <div style={card}>
        <h2>Nueva Orden</h2>

        {Object.keys(form).map((key) => (
          <input
            key={key}
            placeholder={key.toUpperCase()}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />
        ))}

        <button onClick={guardarOrden} style={{ padding: 10, background: "black", color: "white" }}>
          Guardar + Imprimir
        </button>
      </div>

      {/* BUSCADOR */}
      <div style={card}>
        <h2>Buscar</h2>
        <input
          placeholder="Nombre o teléfono"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      {/* LISTA */}
      <div style={card}>
        <h2>Órdenes</h2>

        {["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"].map((estado) => (
          <div key={estado}>
            <h3>{estado}</h3>

            {filtradas
              .filter(o => o.estado === estado)
              .map(o => (
                <div key={o.id} style={{ borderBottom: "1px solid #ddd", padding: 10 }}>
                  <b>{o.numero}</b> - {o.nombre} - {o.dispositivo}
                </div>
              ))}
          </div>
        ))}
      </div>

    </div>
  );
}
