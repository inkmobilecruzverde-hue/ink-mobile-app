"use client";

import { useState, useEffect } from "react";

// 🔥 FIREBASE
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

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
const storage = getStorage(app);

export default function Home() {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [foto, setFoto] = useState(null);

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

  // 📥 CARGAR
  const cargar = async () => {
    const snap = await getDocs(collection(db, "ordenes"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setOrdenes(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  // 🔢 Nº ORDEN REAL
  const siguienteNumero = () => {
    if (ordenes.length === 0) return 1;
    return Math.max(...ordenes.map(o => o.numero || 0)) + 1;
  };

  // 💾 GUARDAR
  const guardar = async () => {
    let urlFoto = "";

    if (foto) {
      const storageRef = ref(storage, "ordenes/" + Date.now());
      await uploadBytes(storageRef, foto);
      urlFoto = await getDownloadURL(storageRef);
    }

    const nueva = {
      ...form,
      numero: siguienteNumero(),
      fecha: new Date().toISOString().split("T")[0],
      estado: "Recibido",
      foto: urlFoto
    };

    await addDoc(collection(db, "ordenes"), nueva);
    cargar();
    imprimir(nueva);

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

    setFoto(null);
  };

  // 🔄 CAMBIAR ESTADO
  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
    cargar();
  };

  // 🧾 IMPRIMIR
  const imprimir = (o) => {
    const w = window.open("", "_blank");

    w.document.write(`
      <style>
        body{font-family:Arial;padding:20px}
        h2{text-align:center}
      </style>

      <h2>INK-MOBILE</h2>
      <p>CIF: E56261365</p>
      <p>Calle Cruz Verde Nº22</p>
      <p>Tel: 600 639 228</p>
      <hr/>
      <p><b>Orden:</b> ${o.numero}</p>
      <p><b>Fecha:</b> ${o.fecha}</p>
      <p><b>Cliente:</b> ${o.nombre}</p>
      <p><b>Tel:</b> ${o.telefono}</p>
      <p><b>Equipo:</b> ${o.dispositivo}</p>
      <p><b>Problema:</b> ${o.problema}</p>
      <p><b>Presupuesto:</b> ${o.presupuesto}€</p>
    `);

    w.print();
  };

  // 🔍 FILTRO
  const filtradas = ordenes.filter(o =>
    o.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.telefono?.includes(busqueda)
  );

  // 🎨 COLOR
  const colorEstado = (estado) => {
    if (estado === "Recibido") return "#3498db";
    if (estado === "Pendiente") return "#f39c12";
    if (estado === "Pendiente de recambio") return "#9b59b6";
    if (estado === "Finalizado") return "#2ecc71";
  };

  return (
    <div style={{ background: "#eef2f7", minHeight: "100vh", padding: 20 }}>

      <h1>🔧 Ink-Mobile</h1>

      {/* FORM */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <h2>Nueva orden</h2>

        {Object.keys(form).map(k => (
          <input
            key={k}
            placeholder={k}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            style={{ width: "100%", marginBottom: 10, padding: 10 }}
          />
        ))}

        {/* FOTO */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files[0])}
        />

        <button
          onClick={guardar}
          style={{
            marginTop: 15,
            padding: 12,
            width: "100%",
            background: "black",
            color: "white",
            borderRadius: 8
          }}
        >
          Guardar + imprimir
        </button>
      </div>

      {/* BUSCAR */}
      <input
        placeholder="Buscar cliente o teléfono"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 20 }}
      />

      {/* COLUMNAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"].map(estado => (
          <div key={estado} style={{ background: "#fff", padding: 10, borderRadius: 10 }}>
            <h3 style={{ color: colorEstado(estado) }}>{estado}</h3>

            {filtradas
              .filter(o => o.estado === estado)
              .map(o => (
                <div key={o.id} style={{ borderBottom: "1px solid #ddd", padding: 8 }}>
                  <b>#{o.numero}</b><br />
                  {o.nombre}<br />
                  {o.dispositivo}

                  {o.foto && (
                    <img
                      src={o.foto}
                      style={{ width: "100%", marginTop: 5, borderRadius: 6 }}
                    />
                  )}

                  <select
                    value={o.estado}
                    onChange={(e) => cambiarEstado(o.id, e.target.value)}
                    style={{ width: "100%", marginTop: 5 }}
                  >
                    <option>Recibido</option>
                    <option>Pendiente</option>
                    <option>Pendiente de recambio</option>
                    <option>Finalizado</option>
                  </select>
                </div>
              ))}
          </div>
        ))}
      </div>

    </div>
  );
}
