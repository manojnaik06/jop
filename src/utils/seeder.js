const mongoose = require('mongoose');
const User = require('../models/user.model');
const StudentProfile = require('../models/studentProfile.model');
const Company = require('../models/company.model');
const PlacementDrive = require('../models/placementDrive.model');
const Application = require('../models/application.model');
const Interview = require('../models/interview.model');
const Task = require('../models/task.model');

const seedDatabase = async () => {
  console.log('Cleaning up existing database collections...');
  await User.deleteMany({});
  await StudentProfile.deleteMany({});
  await Company.deleteMany({});
  await PlacementDrive.deleteMany({});
  await Application.deleteMany({});
  await Interview.deleteMany({});
  await Task.deleteMany({});

  console.log('Database cleared.');

  // 1. Seed Admin and Placement Officer
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'adminpassword',
    role: 'admin',
  });

  const officerUser = await User.create({
    name: 'Placement Officer',
    email: 'officer@test.com',
    password: 'officerpassword',
    role: 'placement_officer',
  });

  // 2. Seed 15 Companies
  const companiesData = [
    { companyId: 'CMP501', name: 'Technova', defaultPackage: 8, eligibleDepartments: ['EEE', 'AI&DS', 'CSE'], minimumCgpa: 6.9, status: 'active' },
    { companyId: 'CMP502', name: 'Cloudify', defaultPackage: 11, eligibleDepartments: ['ECE', 'CSE', 'IT'], minimumCgpa: 7.0, status: 'active' },
    { companyId: 'CMP503', name: 'Datamatrix', defaultPackage: 14, eligibleDepartments: ['CSE', 'IT', 'CIVIL'], minimumCgpa: 8.0, status: 'active' },
    { companyId: 'CMP504', name: 'AlphaCode', defaultPackage: 6, eligibleDepartments: ['IT', 'ECE', 'CSE'], minimumCgpa: 6.0, status: 'active' },
    { companyId: 'CMP505', name: 'LogiTech', defaultPackage: 9, eligibleDepartments: ['CSE', 'IT'], minimumCgpa: 7.5, status: 'active' },
    { companyId: 'CMP509', name: 'Innovent', defaultPackage: 15, eligibleDepartments: ['CIVIL', 'EEE', 'CSE'], minimumCgpa: 6.2, status: 'active' },
    { companyId: 'CMP517', name: 'Pixelcraft', defaultPackage: 11, eligibleDepartments: ['EEE', 'ECE', 'CSE'], minimumCgpa: 6.9, status: 'active' },
    { companyId: 'CMP518', name: 'Blueorbit', defaultPackage: 12, eligibleDepartments: ['CSE', 'IT', 'ECE'], minimumCgpa: 7.2, status: 'active' },
    { companyId: 'CMP506', name: 'Innovaccer', defaultPackage: 10, eligibleDepartments: ['IT', 'CSE'], minimumCgpa: 7.0, status: 'active' },
    { companyId: 'CMP507', name: 'Metaverse', defaultPackage: 18, eligibleDepartments: ['CSE', 'AI&DS', 'IT'], minimumCgpa: 8.5, status: 'active' },
    { companyId: 'CMP508', name: 'TechMahindra', defaultPackage: 5, eligibleDepartments: ['ECE', 'EEE', 'CIVIL', 'CSE'], minimumCgpa: 6.0, status: 'active' },
    { companyId: 'CMP510', name: 'Cognizant', defaultPackage: 4, eligibleDepartments: ['CSE', 'ECE', 'EEE', 'IT', 'CIVIL'], minimumCgpa: 5.5, status: 'active' },
    { companyId: 'CMP511', name: 'TCS', defaultPackage: 4, eligibleDepartments: ['CSE', 'ECE', 'EEE', 'IT', 'CIVIL'], minimumCgpa: 5.5, status: 'active' },
    { companyId: 'CMP512', name: 'Infosys', defaultPackage: 4, eligibleDepartments: ['CSE', 'ECE', 'EEE', 'IT', 'CIVIL'], minimumCgpa: 5.5, status: 'active' },
    { companyId: 'CMP513', name: 'Wipro', defaultPackage: 4, eligibleDepartments: ['CSE', 'ECE', 'EEE', 'IT', 'CIVIL'], minimumCgpa: 5.5, status: 'active' }
  ];

  const seededCompanies = [];
  for (const comp of companiesData) {
    const c = await Company.create(comp);
    seededCompanies.push(c);
  }
  console.log('Seeded 15 Companies.');

  // 3. Seed 22 PlacementDrives
  const drivesData = [
    { driveId: 'DRV101', companyIndex: 6, title: 'Pixelcraft Hiring Drive', mode: 'online', location: 'Chennai', registrationDeadline: '2026-10-14T00:00:00.000Z', status: 'open', packageLpa: 11, minimumCgpa: 6.9, requiredSkills: ['React', 'JavaScript', 'Node.js'] },
    { driveId: 'DRV105', companyIndex: 5, title: 'Innovent Hiring Drive', mode: 'offline', location: 'Pune', registrationDeadline: '2026-10-01T00:00:00.000Z', status: 'open', packageLpa: 15, minimumCgpa: 6.2, rounds: ['HR', 'Managerial'], requiredSkills: ['C++', 'Algorithms', 'Databases'] },
    { driveId: 'DRV136', companyIndex: 2, title: 'Datamatrix Hiring Drive', mode: 'hybrid', location: 'Bangalore', registrationDeadline: '2026-10-23T00:00:00.000Z', status: 'open', packageLpa: 14, minimumCgpa: 8.0, rounds: ['Managerial', 'Aptitude', 'Aptitude', 'Technical'], requiredSkills: ['Python', 'Machine Learning', 'SQL'] },
    { driveId: 'DRV108', companyIndex: 7, title: 'Blueorbit Hiring Drive', mode: 'online', location: 'Hyderabad', registrationDeadline: '2026-10-06T00:00:00.000Z', status: 'open', packageLpa: 12, minimumCgpa: 7.2, rounds: ['HR'], requiredSkills: ['Java', 'Spring Boot', 'SQL'] },
    { driveId: 'DRV9001', companyIndex: 1, title: 'Cloudify Hiring Drive', mode: 'online', location: 'Mumbai', registrationDeadline: '2026-10-15T00:00:00.000Z', status: 'open', packageLpa: 11, minimumCgpa: 7.0, requiredSkills: ['AWS', 'Docker', 'Kubernetes'] }
  ];

  // Fill up to 22 drives
  const existingIds = new Set(drivesData.map(d => d.driveId));
  let counter = 101;
  while (drivesData.length < 22) {
    const driveId = `DRV${counter}`;
    if (!existingIds.has(driveId)) {
      const compIdx = drivesData.length % 15;
      const comp = seededCompanies[compIdx];
      drivesData.push({
        driveId,
        companyIndex: compIdx,
        title: `${comp.name} General Hiring`,
        mode: drivesData.length % 2 === 0 ? 'online' : 'offline',
        location: drivesData.length % 3 === 0 ? 'Bangalore' : (drivesData.length % 3 === 1 ? 'Noida' : 'Gurgaon'),
        registrationDeadline: `2026-11-${10 + (drivesData.length % 20)}T00:00:00.000Z`,
        status: 'open',
        packageLpa: comp.defaultPackage || 6,
        minimumCgpa: comp.minimumCgpa || 6.0,
        requiredSkills: ['Software Engineering', 'Problem Solving'],
      });
      existingIds.add(driveId);
    }
    counter++;
  }

  const seededDrives = [];
  for (const drive of drivesData) {
    const comp = seededCompanies[drive.companyIndex];
    const d = await PlacementDrive.create({
      driveId: drive.driveId,
      company: comp._id,
      title: drive.title,
      mode: drive.mode,
      location: drive.location,
      registrationDeadline: new Date(drive.registrationDeadline),
      rounds: drive.rounds || ['Aptitude', 'Technical'],
      requiredSkills: drive.requiredSkills,
      minimumCgpa: drive.minimumCgpa,
      packageLpa: drive.packageLpa,
      status: drive.status,
      createdBy: adminUser._id,
    });
    seededDrives.push(d);
  }
  console.log('Seeded 22 PlacementDrives.');

  // 4. Seed 120 Students
  const firstNames = ['Ishaan', 'Priyansh', 'Sara', 'Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Kabir', 'Rohan', 'Neha', 'Ananya', 'Diya', 'Riya', 'Ira', 'Avani', 'Myra', 'Kiara', 'Zara', 'Saanvi'];
  const lastNames = ['Shankar', 'Edwin', 'Master', 'Sharma', 'Patel', 'Verma', 'Gupta', 'Reddy', 'Nair', 'Rao', 'Singh', 'Sen', 'Joshi', 'Mehta', 'Kumar', 'Kapoor', 'Roy', 'Das', 'Bose', 'Dasgupta'];
  
  const seededStudents = [];
  for (let i = 1; i <= 120; i++) {
    let name = '';
    let branch = 'CSE';
    let cgpa = 8.0;
    let skills = ['JavaScript', 'HTML', 'CSS'];
    let graduationYear = 2026;
    let phone = '9876543210';
    let status = 'active';

    if (i === 9) {
      name = 'Ishaan Shankar';
      branch = 'EEE';
      cgpa = 7.0;
      skills = ['SQL', 'MongoDB', 'Django'];
      graduationYear = 2027;
      phone = '9224956459';
      status = 'active';
    } else if (i === 45) {
      name = 'Priyansh Edwin';
      branch = 'IT';
      cgpa = 8.4;
      skills = ['Machine Learning', 'Python'];
      graduationYear = 2026;
      phone = '9099104722';
      status = 'inactive';
    } else if (i === 60) {
      name = 'Sara Master';
      branch = 'CSE'; // or IT or EEE
      cgpa = 8.5;
      skills = ['Java', 'Spring', 'MySQL'];
      graduationYear = 2026;
      phone = '9988776655';
      status = 'active';
    } else {
      const fIdx = (i + 5) % firstNames.length;
      const lIdx = (i + 12) % lastNames.length;
      name = `${firstNames[fIdx]} ${lastNames[lIdx]}`;
      
      const branches = ['CSE', 'IT', 'EEE', 'ECE', 'CIVIL'];
      branch = branches[i % branches.length];
      
      cgpa = parseFloat((6.5 + (i % 31) * 0.1).toFixed(1)); // CGPAs from 6.5 to 9.5
      skills = i % 2 === 0 ? ['JavaScript', 'Node.js', 'React'] : ['Java', 'SQL', 'Git'];
      graduationYear = i % 2 === 0 ? 2026 : 2027;
      phone = `${9000000000 + i * 7654321 % 100000000}`;
      status = i % 10 === 0 ? 'placed' : 'active';
    }

    const u = await User.create({
      name,
      email: `student${i}@test.com`,
      password: `STU${1000 + i}`,
      role: 'student',
    });

    const sp = await StudentProfile.create({
      userId: u._id,
      name,
      email: u.email,
      studentId: `STU${1000 + i}`,
      rollNumber: `ROLL${1000 + i}`,
      cgpa,
      branch,
      departments: [branch],
      graduationYear,
      phone,
      status,
      skills,
    });

    seededStudents.push(sp);
  }
  console.log('Seeded 120 Students.');

  // 5. Seed 350 Applications
  console.log('Generating 350 applications...');
  const seededApps = [];
  const studentAppliedSet = new Map(); // studentUserId -> Set of driveIds

  // Seed mandatory ones first
  // APP9004: student STU1045 (i=45), drive DRV136 (seededDrives[2]), status: 'applied', currentRound: 2 (Aptitude)
  // APP9145: student STU1060 (i=60), drive DRV108 (seededDrives[3]), status: 'shortlisted', currentRound: 1 (HR)
  
  const appSpecs = [
    {
      applicationId: 'APP9004',
      studentIdx: 45 - 1,
      driveIdx: 2,
      status: 'applied',
      currentRound: 2,
      appliedAt: new Date('2026-10-19T00:00:00.000Z')
    },
    {
      applicationId: 'APP9145',
      studentIdx: 60 - 1,
      driveIdx: 3,
      status: 'shortlisted',
      currentRound: 1,
      appliedAt: new Date('2026-10-06T00:00:00.000Z')
    }
  ];

  for (const spec of appSpecs) {
    const student = seededStudents[spec.studentIdx];
    const drive = seededDrives[spec.driveIdx];
    
    // Temporarily set student and drive status to active to bypass validations
    const prevStudentStatus = student.status;
    const prevDriveStatus = drive.status;
    student.status = 'active';
    drive.status = 'active';
    await student.save();
    await drive.save();

    const app = await Application.create({
      applicationId: spec.applicationId,
      studentId: student.userId,
      driveId: drive._id,
      resumeUrl: 'https://resume.com/file',
      cgpa: student.cgpa,
      status: spec.status,
      currentRound: spec.currentRound,
      appliedAt: spec.appliedAt
    });
    
    student.status = prevStudentStatus;
    drive.status = prevDriveStatus;
    await student.save();
    await drive.save();

    seededApps.push(app);
    if (!studentAppliedSet.has(student.userId.toString())) {
      studentAppliedSet.set(student.userId.toString(), new Set());
    }
    studentAppliedSet.get(student.userId.toString()).add(drive._id.toString());
  }

  // Generate remaining 348 applications
  let appCounter = 3;
  let attempts = 0;
  while (seededApps.length < 350 && attempts < 10000) {
    attempts++;
    const studentIdx = Math.floor(Math.random() * seededStudents.length);
    const driveIdx = Math.floor(Math.random() * seededDrives.length);
    const student = seededStudents[studentIdx];
    const drive = seededDrives[driveIdx];

    const studentIdStr = student.userId.toString();
    const driveIdStr = drive._id.toString();

    if (!studentAppliedSet.has(studentIdStr)) {
      studentAppliedSet.set(studentIdStr, new Set());
    }

    if (studentAppliedSet.get(studentIdStr).has(driveIdStr)) {
      continue; // Student already applied to this drive
    }

    // Bypass schema validation preconditions temporarily
    const prevStudentStatus = student.status;
    const prevDriveStatus = drive.status;
    const prevStudentCgpa = student.cgpa;

    student.status = 'active';
    drive.status = 'active';
    // Ensure student CGPA >= drive minimum CGPA to pass validation
    if (student.cgpa < drive.minimumCgpa) {
      student.cgpa = drive.minimumCgpa + 0.1;
    }

    await student.save();
    await drive.save();

    try {
      const app = await Application.create({
        applicationId: `APP${1000 + appCounter}`,
        studentId: student.userId,
        driveId: drive._id,
        resumeUrl: 'https://resume.com/general_resume.pdf',
        cgpa: student.cgpa,
        status: appCounter % 5 === 0 ? 'shortlisted' : (appCounter % 9 === 0 ? 'selected' : (appCounter % 13 === 0 ? 'rejected' : 'applied')),
        currentRound: appCounter % 5 === 0 ? 2 : 1,
        appliedAt: new Date(Date.now() - (appCounter * 60 * 60 * 1000)),
      });

      seededApps.push(app);
      studentAppliedSet.get(studentIdStr).add(driveIdStr);
      appCounter++;
    } catch (err) {
      // Ignore creation errors and try again
    } finally {
      // Restore original student & drive values
      student.status = prevStudentStatus;
      student.cgpa = prevStudentCgpa;
      drive.status = prevDriveStatus;
      await student.save();
      await drive.save();
    }
  }

  console.log(`Seeded exactly ${seededApps.length} Applications.`);

  // 6. Seed Interviews
  // INT303: application APP9145 (seededApps[1]), interviewer "Sumer Sen", round "HR", status "completed", result "pass"
  const mandatoryInterview = await Interview.create({
    interviewId: 'INT303',
    application: seededApps[1]._id,
    interviewer: 'Sumer Sen',
    round: 'HR',
    interviewDate: new Date('2026-11-15T00:00:00.000Z'),
    status: 'completed',
    result: 'pass',
    feedback: '',
  });
  console.log('Seeded mandatory Interview INT303.');

  // Seed a few other interviews to have some data
  for (let j = 2; j < 30; j++) {
    const app = seededApps[j];
    if (app.status === 'shortlisted' || app.status === 'selected') {
      await Interview.create({
        interviewId: `INT${300 + j}`,
        application: app._id,
        interviewer: j % 2 === 0 ? 'Sumer Sen' : 'Rahul Deshmukh',
        round: j % 3 === 0 ? 'Technical' : 'Aptitude',
        interviewDate: new Date(Date.now() + (j * 24 * 60 * 60 * 1000)),
        status: j % 4 === 0 ? 'pending' : 'completed',
        result: j % 4 === 0 ? 'pending' : 'pass',
        feedback: j % 4 === 0 ? '' : 'Good performance.',
      });
    }
  }
  console.log('Seeded database interviews.');

  // 7. Seed Tasks
  for (let t = 1; t <= 5; t++) {
    await Task.create({
      externalId: `TSK${100 + t}`,
      title: `Task Title ${t}`,
      description: `Task description for ${t}`,
      status: t % 2 === 0 ? 'completed' : 'pending',
      priority: t % 3 === 0 ? 'high' : 'medium',
      dueDate: new Date(Date.now() + (t * 24 * 60 * 60 * 1000)),
    });
  }
  console.log('Seeded Tasks.');

  return {
    students: 120,
    companies: 15,
    drives: 22,
    applications: 350
  };
};

module.exports = { seedDatabase };
