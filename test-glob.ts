const modules = import.meta.glob('./firebase-applet-config.json', { eager: true });
console.log(modules);
