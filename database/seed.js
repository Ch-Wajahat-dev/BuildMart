require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const { connectDB, Category, Product, User } = require("./db");

const CATEGORIES = [
  { _id: "hand-tools",  name: "Hand Tools",         icon: "fa-hammer",             color: "#e05c1a", bg: "rgba(224,92,26,0.1)"   },
  { _id: "power-tools", name: "Power Tools",         icon: "fa-screwdriver-wrench", color: "#7c3aed", bg: "rgba(124,58,237,0.1)"  },
  { _id: "electrical",  name: "Electrical",          icon: "fa-bolt",               color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  { _id: "plumbing",    name: "Plumbing",             icon: "fa-faucet",             color: "#0891b2", bg: "rgba(8,145,178,0.1)"   },
  { _id: "safety",      name: "Safety Equipment",    icon: "fa-helmet-safety",      color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  { _id: "fasteners",   name: "Fasteners",           icon: "fa-gear",               color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  { _id: "paint",       name: "Paint & Supplies",    icon: "fa-paint-roller",       color: "#ec4899", bg: "rgba(236,72,153,0.1)"  },
  { _id: "building",    name: "Building Materials",  icon: "fa-industry",           color: "#78716c", bg: "rgba(120,113,108,0.1)" },
];

const PRODUCTS = [
  { _id:1,  name:"Professional Claw Hammer",    category:"hand-tools",  categoryName:"Hand Tools",         price:1200, originalPrice:1500, rating:4.5, reviews:128, stock:25,  description:"Heavy-duty 16oz claw hammer with fiberglass handle. Perfect for framing, decking, and general construction work.", icon:"fa-hammer",             iconColor:"#e05c1a", image:"img/hammer.jpg",          featured:true,  isNew:false, onSale:true,  brand:"Stanley"   },
  { _id:2,  name:"Screwdriver Set (12pc)",       category:"hand-tools",  categoryName:"Hand Tools",         price:850,  originalPrice:1100, rating:4.7, reviews:203, stock:40,  description:"12-piece screwdriver set with magnetic tips. Includes flat head and Phillips in various sizes.", icon:"fa-screwdriver",        iconColor:"#6366f1", image:"img/screwdriver-set.jpg", featured:true,  isNew:false, onSale:true,  brand:"DeWalt"    },
  { _id:3,  name:'Adjustable Wrench (12")',      category:"hand-tools",  categoryName:"Hand Tools",         price:650,  originalPrice:null, rating:4.3, reviews:87,  stock:30,  description:"12-inch adjustable wrench with comfortable grip handle. Ideal for pipes and nuts.", icon:"fa-wrench",             iconColor:"#0891b2", image:"img/wrench.jpg",          featured:false, isNew:false, onSale:false, brand:"Irwin"     },
  { _id:4,  name:"Needle Nose Pliers",           category:"hand-tools",  categoryName:"Hand Tools",         price:480,  originalPrice:null, rating:4.4, reviews:65,  stock:45,  description:"6-inch needle nose pliers with wire cutter. Perfect for electrical work and tight spaces.", icon:"fa-toolbox",            iconColor:"#059669", image:"img/pliers.jpg",          featured:false, isNew:true,  onSale:false, brand:"Knipex"    },
  { _id:5,  name:"Steel Tape Measure (10m)",     category:"hand-tools",  categoryName:"Hand Tools",         price:380,  originalPrice:null, rating:4.6, reviews:156, stock:60,  description:"Professional 10m tape measure with magnetic tip and belt clip.", icon:"fa-ruler",              iconColor:"#d97706", image:"img/tape-measure.jpg",    featured:false, isNew:false, onSale:false, brand:"Stanley"   },
  { _id:6,  name:"Cordless Drill (18V)",         category:"power-tools", categoryName:"Power Tools",        price:8500, originalPrice:10000,rating:4.8, reviews:312, stock:15,  description:"18V cordless drill with 2 batteries, charger, and carrying case. 20 torque settings.", icon:"fa-screwdriver-wrench", iconColor:"#e05c1a", image:"img/drill.jpg",           featured:true,  isNew:false, onSale:true,  brand:"DeWalt"    },
  { _id:7,  name:'Angle Grinder (4.5")',         category:"power-tools", categoryName:"Power Tools",        price:5200, originalPrice:6500, rating:4.6, reviews:189, stock:20,  description:"900W angle grinder with guard and 2 grinding wheels. Variable speed control.", icon:"fa-circle-notch",       iconColor:"#7c3aed", image:"img/grinder.jpg",         featured:true,  isNew:false, onSale:true,  brand:"Bosch"     },
  { _id:8,  name:'Circular Saw (7.25")',         category:"power-tools", categoryName:"Power Tools",        price:9800, originalPrice:null, rating:4.7, reviews:145, stock:10,  description:"15-amp circular saw with laser guide and blade wrench. Cuts up to 2.5 inch depth.", icon:"fa-compact-disc",       iconColor:"#dc2626", image:"img/circular-saw.jpg",    featured:false, isNew:true,  onSale:false, brand:"Makita"    },
  { _id:9,  name:"Random Orbital Sander",        category:"power-tools", categoryName:"Power Tools",        price:3800, originalPrice:null, rating:4.4, reviews:98,  stock:18,  description:"Random orbital sander with dust collection bag. 5-inch pad with variable speed.", icon:"fa-fan",                iconColor:"#0891b2", image:"img/sander.jpg",          featured:false, isNew:false, onSale:false, brand:"Bosch"     },
  { _id:10, name:"Electrical Wire (100m Roll)",  category:"electrical",  categoryName:"Electrical",         price:2800, originalPrice:3200, rating:4.5, reviews:73,  stock:35,  description:"100m roll of 2.5mm² electrical wire. Single core, PVC insulated. Suitable for domestic wiring.", icon:"fa-plug",               iconColor:"#f59e0b", image:"img/electrical-wire.jpg", featured:false, isNew:false, onSale:true,  brand:"Havells"   },
  { _id:11, name:"Circuit Breaker Box (8-way)",  category:"electrical",  categoryName:"Electrical",         price:3500, originalPrice:null, rating:4.7, reviews:44,  stock:12,  description:"8-way distribution board with main switch. Includes DIN rail mounting.", icon:"fa-bolt",               iconColor:"#f59e0b", image:"img/circuit-breaker.jpg", featured:false, isNew:false, onSale:false, brand:"Schneider" },
  { _id:12, name:"Wall Socket (3-pin)",          category:"electrical",  categoryName:"Electrical",         price:180,  originalPrice:null, rating:4.3, reviews:201, stock:100, description:"13A 3-pin wall socket with child safety shutters. White finish.", icon:"fa-power-off",          iconColor:"#374151", image:"img/wall-socket.jpg",     featured:false, isNew:false, onSale:false, brand:"MK"        },
  { _id:13, name:"LED Bulb Pack (10pc - 10W)",   category:"electrical",  categoryName:"Electrical",         price:950,  originalPrice:1200, rating:4.8, reviews:387, stock:80,  description:"10W LED bulbs, pack of 10. 6500K cool white, 850 lumens. Energy saving.", icon:"fa-lightbulb",          iconColor:"#fbbf24", image:"img/led-bulb.jpg",        featured:true,  isNew:false, onSale:true,  brand:"Philips"   },
  { _id:14, name:"PVC Pipe Set (6-piece)",       category:"plumbing",    categoryName:"Plumbing",           price:1200, originalPrice:null, rating:4.3, reviews:56,  stock:30,  description:"6-piece PVC pipe set with connectors. 1 inch diameter, 1m length each.", icon:"fa-faucet",             iconColor:"#0891b2", image:"img/pvc-pipe.jpg",        featured:false, isNew:false, onSale:false, brand:"Wavin"     },
  { _id:15, name:'Brass Ball Valve (1/2")',      category:"plumbing",    categoryName:"Plumbing",           price:420,  originalPrice:null, rating:4.5, reviews:89,  stock:40,  description:"1/2 inch brass ball valve with lever handle. For water and gas lines.", icon:"fa-gear",               iconColor:"#64748b", image:"img/ball-valve.jpg",      featured:false, isNew:false, onSale:false, brand:"Pegler"    },
  { _id:16, name:"Kitchen Mixer Tap",            category:"plumbing",    categoryName:"Plumbing",           price:4500, originalPrice:5500, rating:4.6, reviews:112, stock:8,   description:"Chrome kitchen mixer tap with pull-out spray head. Hot and cold water.", icon:"fa-droplet",            iconColor:"#0891b2", image:"img/kitchen-tap.jpg",     featured:false, isNew:true,  onSale:true,  brand:"Grohe"     },
  { _id:17, name:"Safety Hard Hat (Yellow)",     category:"safety",      categoryName:"Safety Equipment",   price:650,  originalPrice:null, rating:4.4, reviews:67,  stock:50,  description:"Class A hard hat with ratchet adjustment. EN 397 certified. UV stabilized.", icon:"fa-helmet-safety",     iconColor:"#f59e0b", image:"img/hard-hat.jpg",        featured:false, isNew:false, onSale:false, brand:"MSA"       },
  { _id:18, name:"Cut-Resistant Gloves (Pair)",  category:"safety",      categoryName:"Safety Equipment",   price:280,  originalPrice:null, rating:4.5, reviews:134, stock:75,  description:"Level 5 cut-resistant safety gloves. Nitrile coated palm for extra grip.", icon:"fa-hand",               iconColor:"#10b981", image:"img/safety-gloves.jpg",   featured:false, isNew:false, onSale:false, brand:"Ejendals"  },
  { _id:19, name:"Anti-Fog Safety Glasses",      category:"safety",      categoryName:"Safety Equipment",   price:350,  originalPrice:450,  rating:4.6, reviews:98,  stock:60,  description:"Anti-fog safety glasses with UV protection. Clear lens. EN 166 certified.", icon:"fa-glasses",            iconColor:"#6366f1", image:"img/safety-glasses.jpg",  featured:false, isNew:false, onSale:true,  brand:"3M"        },
  { _id:20, name:"Wood Screw Assortment (500pc)",category:"fasteners",   categoryName:"Fasteners",          price:750,  originalPrice:900,  rating:4.7, reviews:245, stock:60,  description:"500-piece zinc plated wood screw assortment. Sizes M3 to M6.", icon:"fa-gear",               iconColor:"#6b7280", image:"img/wood-screws.jpg",     featured:false, isNew:false, onSale:true,  brand:"Generic"   },
  { _id:21, name:"Bolt & Nut Kit (200pc)",       category:"fasteners",   categoryName:"Fasteners",          price:580,  originalPrice:null, rating:4.5, reviews:178, stock:45,  description:"200-piece stainless steel bolt and nut assortment. M4 to M10.", icon:"fa-circle",             iconColor:"#78716c", image:"img/bolts-nuts.jpg",      featured:false, isNew:false, onSale:false, brand:"Generic"   },
  { _id:22, name:"Interior Wall Paint (4L)",     category:"paint",       categoryName:"Paint & Supplies",   price:2200, originalPrice:2600, rating:4.5, reviews:189, stock:25,  description:"Washable interior emulsion. White. Coverage ~55 m2. Low VOC formula.", icon:"fa-paint-roller",       iconColor:"#ec4899", image:"img/wall-paint.jpg",      featured:false, isNew:false, onSale:true,  brand:"Dulux"     },
  { _id:23, name:"Paint Brush Set (5pc)",        category:"paint",       categoryName:"Paint & Supplies",   price:380,  originalPrice:null, rating:4.3, reviews:76,  stock:40,  description:'5-piece synthetic bristle brush set. Sizes: 1", 1.5", 2", 2.5", 3".', icon:"fa-paintbrush",         iconColor:"#8b5cf6", image:"img/paint-brush.jpg",     featured:false, isNew:false, onSale:false, brand:"Harris"    },
  { _id:24, name:"Portland Cement (50kg Bag)",   category:"building",    categoryName:"Building Materials", price:1100, originalPrice:null, rating:4.4, reviews:312, stock:200, description:"OPC 52.5N Portland cement. Water-resistant formulation for general construction.", icon:"fa-industry",           iconColor:"#78716c", image:"img/cement.jpg",          featured:false, isNew:false, onSale:false, brand:"DG Khan"   },
];

async function seed() {
  await connectDB();

  // Categories
  for (const c of CATEGORIES) {
    await Category.findByIdAndUpdate(c._id, c, { upsert: true, new: true });
  }
  console.log(`  Seeded ${CATEGORIES.length} categories`);

  // Products
  for (const p of PRODUCTS) {
    await Product.findByIdAndUpdate(p._id, p, { upsert: true, new: true });
  }
  console.log(`  Seeded ${PRODUCTS.length} products`);

  // Admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  await User.findOneAndUpdate(
    { email: "admin@ironcraft.pk" },
    { name: "Admin", email: "admin@ironcraft.pk", password: adminHash, role: "admin" },
    { upsert: true, new: true }
  );
  console.log("  Admin user: admin@ironcraft.pk / admin123");

  // Demo customer
  const demoHash = await bcrypt.hash("demo1234", 10);
  await User.findOneAndUpdate(
    { email: "demo@ironcraft.pk" },
    { name: "Demo User", email: "demo@ironcraft.pk", password: demoHash, role: "customer" },
    { upsert: true, new: true }
  );
  console.log("  Demo user: demo@ironcraft.pk / demo1234");

  console.log("\nDatabase seeded successfully!\n");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
