// particles.js - 3D Particle System
class ParticleSystem {
  constructor(scene, boundary = 4) {
    this.scene = scene;
    this.boundary = boundary;
    this.particles = [];
  }

  createParticle(molecule, type = "reactant") {
    const geometry = new THREE.SphereGeometry(molecule.size * 0.2, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(molecule.color),
      roughness: 0.2,
      metalness: 0.1,
      emissive: new THREE.Color(molecule.color),
      emissiveIntensity: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (Math.random() - 0.5) * this.boundary * 1.5,
      (Math.random() - 0.5) * this.boundary * 1.5,
      (Math.random() - 0.5) * this.boundary * 1.5,
    );

    mesh.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
      ),
      type: type,
      molecule: molecule,
    };

    this.particles.push(mesh);
    this.scene.add(mesh);
    return mesh;
  }

  clearAll() {
    this.particles.forEach((p) => this.scene.remove(p));
    this.particles = [];
  }

  createFromReaction(reaction, progress) {
    this.clearAll();

    const mixFactor = progress;

    // Reactants
    reaction.reactants.forEach((molecule) => {
      const activeCount = Math.floor(molecule.count * (1 - mixFactor));
      for (let i = 0; i < activeCount; i++) {
        this.createParticle(molecule, "reactant");
      }
    });

    // Products
    reaction.products.forEach((molecule) => {
      const activeCount = Math.floor(molecule.count * mixFactor);
      for (let i = 0; i < activeCount; i++) {
        this.createParticle(molecule, "product");
      }
    });
  }

  updateMotion(speedMultiplier) {
    this.particles.forEach((particle) => {
      const vel = particle.userData.velocity;

      particle.position.add(vel.clone().multiplyScalar(speedMultiplier));

      particle.rotation.x += vel.x * speedMultiplier;
      particle.rotation.y += vel.y * speedMultiplier;

      // Bounce off boundaries
      if (Math.abs(particle.position.x) > this.boundary) vel.x *= -1;
      if (Math.abs(particle.position.y) > this.boundary) vel.y *= -1;
      if (Math.abs(particle.position.z) > this.boundary) vel.z *= -1;
    });
  }

  getCount() {
    return this.particles.length;
  }
}
