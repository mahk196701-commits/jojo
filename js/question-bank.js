/* =========================================================================
   question-bank.js — بنك أسئلة مكتوبة لمقررات محددة، مع الإجابات
   PHYS 103: مبني على شرائح المحاضرة (Serway — الفصول 2، 3، 4، 5، 7، 8)
   الأسئلة بالإنجليزية لأنها لغة الاختبار. lecture: true = مسألة من شرائح المحاضرة
   كل الإجابات العددية محسوبة بـ g = 9.80 m/s²
   ========================================================================= */
(function (root) {
  'use strict';
  const D = root.StudyData;

  // شابترات فيزياء (1) كما في شرائح المحاضرة
  const PHYS103_CHAPTERS = [
    { title: 'Ch 2 — Motion in One Dimension', bank: 'PHYS103-2',
      topics: ['Displacement vs distance', 'Average velocity and speed', 'Instantaneous velocity', 'Acceleration', 'Constant acceleration equations', 'Free fall'] },
    { title: 'Ch 3 — Vectors', bank: 'PHYS103-3',
      topics: ['Cartesian and polar coordinates', 'Scalars and vectors', 'Adding and subtracting vectors', 'Components and unit vectors'] },
    { title: 'Ch 4 — Motion in Two Dimensions', bank: 'PHYS103-4',
      topics: ['Position, velocity and acceleration vectors', '2D motion with constant acceleration', 'Projectile motion', 'Uniform circular motion', 'Tangential and radial acceleration'] },
    { title: 'Ch 5 — The Laws of Motion', bank: 'PHYS103-5',
      topics: ['Contact and field forces', 'Newton\'s first law', 'Mass', 'Newton\'s second law', 'Weight', 'Newton\'s third law', 'Equilibrium and net force models', 'Friction'] },
    { title: 'Ch 7 — Energy of a System', bank: 'PHYS103-7',
      topics: ['System and environment', 'Work by a constant force', 'Scalar product', 'Work by a varying force (springs)', 'Work–kinetic energy theorem', 'Potential energy'] },
    { title: 'Ch 8 — Conservation of Energy', bank: 'PHYS103-8',
      topics: ['Nonisolated system', 'Isolated system', 'Conservation of mechanical energy'] }
  ];

  const QUESTION_BANK = {
    'PHYS103-2': [
      { type: 'problem', lecture: true, text: 'A particle moves according to x = 10t² (x in m, t in s). Find the average velocity (a) from t = 2.00 s to 3.00 s and (b) from t = 2.00 s to 2.10 s.', answer: '(a) 50.0 m/s  (b) 41.0 m/s — the second value approaches the instantaneous velocity at t = 2 s (40 m/s).' },
      { type: 'problem', lecture: true, text: 'An object moves along x according to x = 3t² − 2t + 3. Find (a) the average speed between t = 2 s and 3 s, (b) the instantaneous speed at t = 2 s and t = 3 s, (c) the average acceleration between 2 s and 3 s, (d) the instantaneous acceleration, (e) when the object is at rest.', answer: '(a) 13 m/s  (b) v = 6t − 2 → 10 m/s and 16 m/s  (c) 6 m/s²  (d) 6 m/s² at both times  (e) t = 1/3 s ≈ 0.333 s' },
      { type: 'problem', lecture: true, text: 'An electron accelerates uniformly from 2 × 10⁴ m/s to 6 × 10⁶ m/s over 1.50 cm. Find (a) the time interval and (b) the acceleration.', answer: '(a) t = 2Δx/(vi + vf) = 4.98 × 10⁻⁹ s  (b) a = (vf² − vi²)/(2Δx) = 1.20 × 10¹⁵ m/s²' },
      { type: 'problem', lecture: true, text: 'A truck covers 40.0 m in 8.50 s while smoothly slowing down to 2.80 m/s. Find (a) its original speed and (b) its acceleration.', answer: '(a) vi = 2Δx/t − vf = 6.61 m/s  (b) a = (vf − vi)/t = −0.448 m/s²' },
      { type: 'problem', text: 'A particle moves along x with x = 4t² − 3t + 2 (m). Find (a) the average velocity from t = 1 s to 3 s, (b) the velocity at t = 2 s, (c) the acceleration, (d) when the particle is momentarily at rest.', answer: '(a) (29 − 3)/2 = 13 m/s  (b) v = 8t − 3 = 13 m/s  (c) 8 m/s² (constant)  (d) t = 0.375 s' },
      { type: 'problem', text: 'A car moving at 30.0 m/s brakes with a constant deceleration of 6.00 m/s². Find the stopping time and the stopping distance.', answer: 't = 5.00 s,  d = v²/(2a) = 75.0 m' },
      { type: 'problem', text: 'A ball is thrown straight up at 19.6 m/s. Find (a) the time to reach maximum height, (b) the maximum height, (c) the total time in the air.', answer: '(a) 2.00 s  (b) 19.6 m  (c) 4.00 s' },
      { type: 'problem', text: 'A stone is dropped from rest from a 45.0 m cliff. How long does it take to hit the ground, and how fast is it moving then?', answer: 't = √(2h/g) = 3.03 s,  v = gt = 29.7 m/s' },
      { type: 'mcq', text: 'A runner completes one 400 m lap and returns to the starting point in 80 s. The average velocity is: (a) 5 m/s  (b) 0  (c) 80 m/s  (d) 400 m/s', answer: '(b) 0 — displacement is zero. The average SPEED is 5 m/s.' },
      { type: 'mcq', text: 'At the highest point of a ball thrown straight up: (a) v = 0 and a = 0  (b) v = 0 and a = 9.80 m/s² downward  (c) v is maximum  (d) a = 0 only', answer: '(b)' },
      { type: 'tf', text: 'True or false: displacement and distance traveled are always equal.', answer: 'False — they are equal only for straight-line motion in one direction. Distance is a scalar (always positive); displacement is a vector.' },
      { type: 'tf', text: 'True or false: an object can have zero velocity and non-zero acceleration at the same instant.', answer: 'True — e.g. a ball at the top of its flight: v = 0, a = g downward.' },
      { type: 'essay', text: 'Explain the difference between average speed and average velocity, with an example where one is zero and the other is not.', answer: 'Average velocity = Δx/Δt (vector, can be ±). Average speed = total distance/Δt (scalar, always ≥ 0). A round trip gives zero average velocity but non-zero average speed.' },
      { type: 'essay', text: 'Write the four equations for a particle under constant acceleration and state which variable each one does not contain.', answer: 'vf = vi + at (no x) · xf = xi + ½(vi + vf)t (no a) · xf = xi + vi t + ½at² (no vf) · vf² = vi² + 2a(xf − xi) (no t)' }
    ],
    'PHYS103-3': [
      { type: 'problem', lecture: true, text: 'The rectangular coordinates of a point are (2, y) and its polar coordinates are (r, 30°). Find y and r.', answer: 'y = 2 tan 30° = 1.15,  r = 2/cos 30° = 2.31' },
      { type: 'problem', lecture: true, text: 'The polar coordinates of a point are (4.30 cm, 214°). Find its Cartesian coordinates.', answer: 'x = 4.30 cos 214° = −3.56 cm,  y = 4.30 sin 214° = −2.40 cm' },
      { type: 'problem', text: 'Find the polar coordinates of the point (x, y) = (−4.00, 3.00) m.', answer: 'r = 5.00 m,  θ = 143° (second quadrant — not −36.9°)' },
      { type: 'problem', text: 'Convert the polar coordinates (6.00 m, 240°) to Cartesian coordinates.', answer: 'x = −3.00 m,  y = −5.20 m' },
      { type: 'problem', text: 'Given A = 3î − 4ĵ and B = −2î + 6ĵ, find A + B and A − B with their magnitudes, and the direction of A + B.', answer: 'A + B = î + 2ĵ, |A + B| = 2.24, direction 63.4° · A − B = 5î − 10ĵ, |A − B| = 11.2' },
      { type: 'problem', text: 'A hiker walks 3.00 km east and then 4.00 km at 30.0° north of east. Find the magnitude and direction of the resultant displacement.', answer: 'Rx = 6.46 km, Ry = 2.00 km → R = 6.77 km at 17.2° north of east' },
      { type: 'mcq', text: 'Which of the following is a vector quantity? (a) mass  (b) speed  (c) displacement  (d) time', answer: '(c) displacement' },
      { type: 'mcq', text: '|A| = 5 units and |B| = 3 units. Which value can |A + B| have? (a) 1  (b) 5  (c) 9  (d) 10', answer: '(b) 5 — the magnitude of the sum lies between 2 and 8.' },
      { type: 'tf', text: 'True or false: the magnitude of a vector can be negative.', answer: 'False — the magnitude is always ≥ 0; only components can be negative.' },
      { type: 'tf', text: 'True or false: a component of a vector can be larger than the magnitude of the vector.', answer: 'False — |Ax| = A|cos θ| ≤ A.' },
      { type: 'essay', text: 'For the point (−3.50, −2.50) m, a calculator gives tan⁻¹(y/x) = 35.5°. Explain why the correct angle is 216° and how to find it.', answer: 'Both x and y are negative, so the point is in the third quadrant; add 180°: 35.5° + 180° = 216°. Always check the signs of x and y.' },
      { type: 'essay', text: 'Define the unit vectors î and ĵ and explain how to write a vector in unit-vector notation.', answer: 'î and ĵ are dimensionless vectors of magnitude 1 along +x and +y. A = Ax î + Ay ĵ, with Ax = A cos θ and Ay = A sin θ.' }
    ],
    'PHYS103-4': [
      { type: 'problem', lecture: true, text: 'A particle\'s position is x = at + b, y = ct² + d with a = 1 m/s, b = 1 m, c = 0.125 m/s², d = 1 m. Find (a) the average velocity from t = 2 s to 4 s and (b) the velocity and speed at t = 2 s.', answer: '(a) (1.00î + 0.750ĵ) m/s  (b) v = (1.00î + 0.500ĵ) m/s, speed 1.12 m/s' },
      { type: 'problem', lecture: true, text: 'A projectile is fired so that its horizontal range equals three times its maximum height. What is the angle of projection?', answer: 'R/H = 4/tan θ = 3 → tan θ = 4/3 → θ = 53.1°' },
      { type: 'problem', text: 'A projectile is launched at 25.0 m/s at 40.0° above the horizontal on level ground. Find the range, maximum height and time of flight.', answer: 'R = v² sin 2θ / g = 62.8 m,  H = 13.2 m,  t = 3.28 s' },
      { type: 'problem', text: 'A ball rolls off a 1.25 m high table at 3.00 m/s. Find the time to reach the floor, the horizontal distance, and the speed on impact.', answer: 't = 0.505 s,  x = 1.52 m,  v = 5.79 m/s' },
      { type: 'problem', text: 'r(t) = (2t² î + 3t ĵ) m. Find the velocity, speed and acceleration at t = 2.00 s.', answer: 'v = 4t î + 3ĵ = (8.00î + 3.00ĵ) m/s, speed 8.54 m/s,  a = 4.00î m/s² (constant)' },
      { type: 'problem', text: 'A car goes around a circle of radius 50.0 m at a constant 15.0 m/s. Find the centripetal acceleration, the period and the angular speed.', answer: 'ac = v²/r = 4.50 m/s²,  T = 2πr/v = 20.9 s,  ω = v/r = 0.300 rad/s' },
      { type: 'problem', text: 'A particle on a circle of radius 2.00 m has speed 4.00 m/s and is speeding up at 3.00 m/s². Find the radial, tangential and total acceleration.', answer: 'ar = 8.00 m/s², at = 3.00 m/s², a = 8.54 m/s² at 20.6° from the radius' },
      { type: 'mcq', text: 'At the top of a projectile\'s path (no air resistance): (a) v = 0  (b) a = 0  (c) vy = 0 and vx is unchanged  (d) vx = 0', answer: '(c)' },
      { type: 'mcq', text: 'On level ground, which launch angle gives the maximum range? (a) 30°  (b) 45°  (c) 60°  (d) 90°', answer: '(b) 45° — and complementary angles (30° and 60°) give equal ranges.' },
      { type: 'tf', text: 'True or false: in uniform circular motion the acceleration is zero because the speed is constant.', answer: 'False — the direction of velocity changes, so there is a centripetal acceleration v²/r toward the center.' },
      { type: 'tf', text: 'True or false: the horizontal and vertical motions of a projectile are independent.', answer: 'True — constant velocity horizontally, constant acceleration (−g) vertically, linked only by time t.' },
      { type: 'essay', text: 'Explain the difference between tangential and radial acceleration, and write the total acceleration.', answer: 'at = d|v|/dt changes the speed (parallel to v); ar = −v²/r changes the direction (toward the center). a = at + ar, |a| = √(at² + ar²).' }
    ],
    'PHYS103-5': [
      { type: 'problem', lecture: true, text: 'A 3.00 kg object has acceleration a = (2î + 5ĵ) m/s². Find the resultant force and its magnitude.', answer: 'F = ma = (6î + 15ĵ) N,  |F| = 16.2 N' },
      { type: 'problem', lecture: true, text: 'F1 = (−6î − 4ĵ) N and F2 = (−3î + 7ĵ) N act on a 2.00 kg particle starting from rest. Find (a) the velocity components at t = 10 s, (b) the direction of motion, (c) the displacement in the first 10 s.', answer: 'a = (−4.5î + 1.5ĵ) m/s² → (a) v = (−45î + 15ĵ) m/s  (b) 162° from +x  (c) Δr = (−225î + 75ĵ) m' },
      { type: 'problem', lecture: true, text: 'A 5.00 kg object on a frictionless table is connected over a pulley to a hanging 9.00 kg object. Find the acceleration and the tension.', answer: 'a = m2 g/(m1 + m2) = 6.30 m/s²,  T = m1 a = 31.5 N' },
      { type: 'problem', lecture: true, text: 'A hanging m1 = 2.00 kg is connected over a pulley to m2 = 6.00 kg on a frictionless 55.0° incline. Find the acceleration, the tension, and the speed after 2.00 s from rest.', answer: 'a = (m2 g sin θ − m1 g)/(m1 + m2) = 3.57 m/s² (m2 slides down),  T = m1(g + a) = 26.7 N,  v = 7.14 m/s' },
      { type: 'problem', text: 'Atwood machine: m1 = 3.00 kg and m2 = 5.00 kg. Find the acceleration and the tension.', answer: 'a = (m2 − m1)g/(m1 + m2) = 2.45 m/s²,  T = 2m1m2g/(m1 + m2) = 36.8 N' },
      { type: 'problem', text: 'A 5.00 kg block slides down a frictionless 30.0° incline. Find its acceleration and the normal force.', answer: 'a = g sin θ = 4.90 m/s²,  n = mg cos θ = 42.4 N' },
      { type: 'problem', text: 'A 4.00 kg block on a table (μk = 0.200) is connected over a pulley to a hanging 2.00 kg block. Find the acceleration and the tension.', answer: 'a = (m2 g − μk m1 g)/(m1 + m2) = 1.96 m/s²,  T = 15.7 N' },
      { type: 'problem', text: 'A 100 N traffic light hangs from two cables making 30.0° and 60.0° with the horizontal. Find the tensions.', answer: 'T1 (30°) = 50.0 N,  T2 (60°) = 86.6 N' },
      { type: 'problem', text: 'A hockey puck given 20.0 m/s slides 115 m before stopping. Find the coefficient of kinetic friction.', answer: 'a = v²/(2d) = 1.74 m/s² → μk = a/g = 0.177' },
      { type: 'mcq', text: 'A 60.0 kg person stands on a scale in an elevator accelerating upward at 2.00 m/s². The scale reads: (a) 468 N  (b) 588 N  (c) 708 N  (d) 120 N', answer: '(c) n = m(g + a) = 708 N' },
      { type: 'mcq', text: 'The reaction force (Newton\'s third law) to the Earth\'s gravitational force on a book resting on a table is: (a) the normal force on the book  (b) the book\'s gravitational pull on the Earth  (c) the table\'s weight  (d) friction', answer: '(b) — action–reaction forces act on different objects.' },
      { type: 'tf', text: 'True or false: an object moving at constant velocity has zero net force acting on it.', answer: 'True — Newton\'s first law (particle in equilibrium).' },
      { type: 'tf', text: 'True or false: the static friction force always equals μs n.', answer: 'False — fs ≤ μs n; it equals μs n only when motion is about to start.' },
      { type: 'essay', text: 'Show that the coefficient of static friction equals tan θc, where θc is the angle at which a block on an incline just starts to slide.', answer: 'At slipping: mg sin θc = fs,max = μs n and n = mg cos θc → μs = tan θc.' },
      { type: 'essay', text: 'Distinguish between mass and weight, and between contact forces and field forces, with examples.', answer: 'Mass: resistance to change in velocity (kg, same everywhere). Weight: Fg = mg (N, depends on g). Contact: pushing, tension, friction. Field: gravity, electric, magnetic.' }
    ],
    'PHYS103-7': [
      { type: 'problem', lecture: true, text: 'A 2.50 kg block is pushed 2.20 m on a frictionless table by F = 16.0 N directed 25.0° below the horizontal. Find the work done by (a) F, (b) the normal force, (c) gravity, (d) the net force.', answer: '(a) Fd cos 25° = 31.9 J  (b) 0  (c) 0  (d) 31.9 J' },
      { type: 'problem', lecture: true, text: 'F = (6î − 2ĵ) N acts on a particle that undergoes Δr = (3î + ĵ) m. Find the work and the angle between F and Δr.', answer: 'W = F·Δr = 16.0 J,  θ = 36.9°' },
      { type: 'problem', lecture: true, text: 'A 3.00 kg object has velocity (6î − ĵ) m/s. (a) What is its kinetic energy? (b) What net work is done if its velocity changes to (8î + 4ĵ) m/s?', answer: '(a) K = ½mv² = 55.5 J  (b) W = ΔK = 120 − 55.5 = 64.5 J' },
      { type: 'problem', text: 'A 50.0 N force pulls a box 8.00 m along the floor at 37.0° above the horizontal. How much work does it do?', answer: 'W = Fd cos θ = 319 J' },
      { type: 'problem', text: 'A = 4î − 3ĵ and B = 2î + 5ĵ. Find A·B and the angle between them.', answer: 'A·B = 8 − 15 = −7,  θ = 105°' },
      { type: 'problem', text: 'A 0.500 kg mass hung from a spring stretches it 2.00 cm. Find k, then the work done by a k = 400 N/m spring as it returns from 10.0 cm compression to equilibrium.', answer: 'k = mg/x = 245 N/m ·  Ws = ½kx² = 2.00 J' },
      { type: 'problem', text: 'A 2.00 kg block at rest is pulled 3.00 m by a 12.0 N horizontal force on a frictionless surface. Find the work and the final speed.', answer: 'W = 36.0 J → v = √(2W/m) = 6.00 m/s' },
      { type: 'problem', text: 'How much does the kinetic energy of a 1500 kg car change when it speeds up from 10.0 m/s to 20.0 m/s?', answer: 'ΔK = ½m(vf² − vi²) = 2.25 × 10⁵ J' },
      { type: 'mcq', text: 'A block slides across a horizontal floor. The work done by the normal force is: (a) positive  (b) negative  (c) zero  (d) equal to mgd', answer: '(c) zero — the normal force is perpendicular to the displacement.' },
      { type: 'mcq', text: 'If the speed of an object doubles, its kinetic energy: (a) doubles  (b) triples  (c) quadruples  (d) stays the same', answer: '(c) quadruples — K ∝ v²' },
      { type: 'tf', text: 'True or false: work can be negative.', answer: 'True — when the force has a component opposite the displacement (e.g. kinetic friction); energy leaves the system.' },
      { type: 'tf', text: 'True or false: the centripetal force does positive work in uniform circular motion.', answer: 'False — it is perpendicular to the velocity, so W = 0 and the speed stays constant.' },
      { type: 'essay', text: 'Explain how to find the work done by a varying force from an F–x graph, and derive the work done by a spring.', answer: 'W = area under the F–x curve (∫F dx). For a spring F = −kx: Ws = ½kxi² − ½kxf².' },
      { type: 'essay', text: 'State the work–kinetic energy theorem and explain why work is described as an energy transfer across the system boundary.', answer: 'Wnet = ΔK. Positive W transfers energy into the system; negative W transfers energy out of it.' }
    ],
    'PHYS103-8': [
      { type: 'problem', lecture: true, text: 'A bead slides without friction around a loop-the-loop of radius R, released from rest at h = 3.50R. (a) What is its speed at the top of the loop (point A)? (b) What is the normal force there if its mass is 5.00 g?', answer: '(a) v = √(2g(3.5R − 2R)) = √(3gR)  (b) n = mv²/R − mg = 2mg = 0.098 N, downward' },
      { type: 'problem', lecture: true, text: 'A 200 g block is released from rest at the rim (point A) of a frictionless hemispherical bowl of radius 30.0 cm. Find (a) the potential energy at A relative to the bottom B, (b) the kinetic energy at B, (c) the speed at B.', answer: '(a) mgR = 0.588 J  (b) 0.588 J  (c) v = √(2gR) = 2.42 m/s' },
      { type: 'problem', text: 'A ball is dropped from 20.0 m. Using conservation of energy, find its speed 5.00 m above the ground.', answer: 'v = √(2g·15.0) = 17.1 m/s' },
      { type: 'problem', text: 'A block slides from rest down a frictionless track from a height of 5.00 m. Find its speed at the bottom and at 2.00 m above the bottom.', answer: '9.90 m/s and 7.67 m/s' },
      { type: 'problem', text: 'A spring (k = 500 N/m) compressed 0.200 m launches a 0.400 kg block on a frictionless surface. Find the launch speed and how high the block rises up a frictionless ramp.', answer: '½kx² = 10.0 J → v = 7.07 m/s,  h = 10.0/(mg) = 2.55 m' },
      { type: 'problem', text: 'A 2.00 m pendulum is released from rest at 60.0° from the vertical. Find the speed at the lowest point.', answer: 'h = L(1 − cos 60°) = 1.00 m → v = √(2gh) = 4.43 m/s' },
      { type: 'problem', text: 'A 0.100 kg block released from h = 3R slides around a frictionless loop of radius R = 0.500 m. Find the speed and the normal force at the top of the loop.', answer: 'v = √(2g(3R − 2R)) = 3.13 m/s,  n = m(v²/R − g) = 0.980 N' },
      { type: 'mcq', text: 'For an isolated system with only conservative forces: (a) K is constant  (b) U is constant  (c) K + U is constant  (d) nothing is conserved', answer: '(c) mechanical energy is conserved.' },
      { type: 'mcq', text: 'Two identical balls are thrown from the same height at the same speed, one straight up and one straight down. On reaching the ground: (a) the upward one is faster  (b) the downward one is faster  (c) same speed  (d) it depends on the mass', answer: '(c) same speed — same initial K and same drop in U.' },
      { type: 'tf', text: 'True or false: in an isolated system, kinetic energy is always conserved.', answer: 'False — the total mechanical energy is conserved; K and U convert into each other.' },
      { type: 'tf', text: 'True or false: the choice of reference level for gravitational potential energy changes ΔU.', answer: 'False — only differences in U matter; the reference level cancels.' },
      { type: 'essay', text: 'Explain the difference between an isolated system and a nonisolated system, and write the conservation of energy equation for each.', answer: 'Nonisolated: energy crosses the boundary, ΔEsystem = ΣT (e.g. W = ΔK). Isolated: nothing crosses, ΔK + ΔU = 0 (conservative forces only).' },
      { type: 'essay', text: 'Solve "ball in free fall" (Example 8.1) twice: with the ball + Earth as the system, then with the ball alone as the system. Why do both give the same answer?', answer: 'Ball + Earth (isolated): mgh = mgy + ½mv². Ball alone (nonisolated): W_gravity = mg(h − y) = ½mv². Both give v = √(2g(h − y)); the gravitational work equals −ΔU.' }
    ]
  };

  D.SUGGESTED_CHAPTERS['PHYS 103'] = PHYS103_CHAPTERS;
  D.QUESTION_BANK = QUESTION_BANK;
  // رقم نسخة محتوى المقرر: يظهر للمستخدم عرض تحديث الشابترات إذا كانت نسخته أقدم
  D.COURSE_CONTENT_VERSION = { 'PHYS 103': 2 };
})(typeof self !== 'undefined' ? self : this);
