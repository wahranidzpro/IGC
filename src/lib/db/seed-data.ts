import { db } from './dexie-db';
import { logger } from '@/lib/logger';
import type { Member, Payment, Expense, CheckIn } from './types';

async function seedMembers() {
  const programs = await db.programs.toArray();
  const coaches = await db.coaches.toArray();

  const existingPhones = new Set((await db.members.toArray()).map(m => m.phone));
  const allSample: Omit<Member, 'id'>[] = [
    { firstName: 'Ahmed', lastName: 'Benali', phone: '0612345678', birthDate: '1990-05-15', address: '12 Rue de la Liberté, Casablanca', gender: 'male', bloodType: 'A+', photo: '', programId: programs[0]?.id, sessionsLeft: 12, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 150, rfidCode: 'RFID001', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'ahmed.benali@email.com', emergencyContactName: 'Fatima Benali', emergencyContactPhone: '0612345679', allergies: 'Arachides', weight: 78, height: 180, fitnessGoal: 'Prise de masse', experienceLevel: 'intermédiaire' },
    { firstName: 'Sara', lastName: 'El Amrani', phone: '0623456789', birthDate: '1995-08-22', address: '45 Avenue Hassan II, Rabat', gender: 'female', bloodType: 'O+', photo: '', programId: programs[1]?.id, sessionsLeft: 8, programAmount: 250, amountPaid: 150, balanceDue: 100, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 80, rfidCode: 'RFID002', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'sara.elamrani@email.com', emergencyContactName: 'Mohamed El Amrani', emergencyContactPhone: '0623456780', allergies: '', weight: 62, height: 165, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Youssef', lastName: 'Idrissi', phone: '0634567890', birthDate: '1988-11-03', address: '8 Rue Atlas, Marrakech', gender: 'male', bloodType: 'B+', photo: '', programId: programs[2]?.id, sessionsLeft: 4, programAmount: 180, amountPaid: 180, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'active', fidelityPoints: 30, rfidCode: 'RFID003', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'youssef.idrissi@email.com', emergencyContactName: 'Nadia Idrissi', emergencyContactPhone: '0634567891', allergies: 'Lactose', weight: 85, height: 175, fitnessGoal: 'Cardio', experienceLevel: 'avancé' },
    { firstName: 'Fatima', lastName: 'Zahra', phone: '0645678901', birthDate: '1992-02-14', address: '23 Boulevard Mohammed V, Fès', gender: 'female', bloodType: 'AB+', photo: '', programId: programs[3]?.id, sessionsLeft: 20, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '12_mois', status: 'active', fidelityPoints: 200, rfidCode: 'RFID004', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'fatima.zahra@email.com', emergencyContactName: 'Hassan Zahra', emergencyContactPhone: '0645678902', allergies: 'Sulfites', weight: 55, height: 160, fitnessGoal: 'Tonicité', experienceLevel: 'intermédiaire' },
    { firstName: 'Omar', lastName: 'Tazi', phone: '0656789012', birthDate: '1985-07-30', address: '15 Rue Al Massira, Tanger', gender: 'male', bloodType: 'O-', photo: '', programId: programs[0]?.id, sessionsLeft: 0, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'expired', fidelityPoints: 500, rfidCode: 'RFID005', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'omar.tazi@email.com', emergencyContactName: 'Amina Tazi', emergencyContactPhone: '0656789013', allergies: '', weight: 90, height: 185, fitnessGoal: 'Prise de masse', experienceLevel: 'avancé' },
    { firstName: 'Nadia', lastName: 'Berrada', phone: '0667890123', birthDate: '1998-12-25', address: '7 Rue des Oliviers, Agadir', gender: 'female', bloodType: 'A-', photo: '', programId: programs[1]?.id, sessionsLeft: 6, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 60, rfidCode: 'RFID006', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'nadia.berrada@email.com', emergencyContactName: 'Karim Berrada', emergencyContactPhone: '0667890124', allergies: 'Gluten', weight: 58, height: 163, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Hassan', lastName: 'Ouazzani', phone: '0678901234', birthDate: '1982-04-18', address: '33 Rue de la Médina, Meknès', gender: 'male', bloodType: 'B-', photo: '', programId: programs[2]?.id, sessionsLeft: 2, programAmount: 180, amountPaid: 100, balanceDue: 80, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'active', fidelityPoints: 45, rfidCode: 'RFID007', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'hassan.ouazzani@email.com', emergencyContactName: 'Saida Ouazzani', emergencyContactPhone: '0678901235', allergies: 'Fruits de mer', weight: 95, height: 178, fitnessGoal: 'Cardio', experienceLevel: 'intermédiaire' },
    { firstName: 'Leila', lastName: 'Benjelloun', phone: '0689012345', birthDate: '1993-09-08', address: '12 Rue Al Andalus, Oujda', gender: 'female', bloodType: 'AB-', photo: '', programId: programs[3]?.id, sessionsLeft: 15, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 120, rfidCode: 'RFID008', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'leila.benjelloun@email.com', emergencyContactName: 'Rachid Benjelloun', emergencyContactPhone: '0689012346', allergies: '', weight: 65, height: 168, fitnessGoal: 'Tonicité', experienceLevel: 'intermédiaire' },
    { firstName: 'Karim', lastName: 'Fassi', phone: '0690123456', birthDate: '1987-06-12', address: '5 Rue Annakhil, Marrakech', gender: 'male', bloodType: 'A+', photo: '', programId: programs[0]?.id, sessionsLeft: 10, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 90, rfidCode: 'RFID009', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'karim.fassi@email.com', emergencyContactName: 'Salma Fassi', emergencyContactPhone: '0690123457', allergies: 'Arachides', weight: 82, height: 182, fitnessGoal: 'Prise de masse', experienceLevel: 'avancé' },
    { firstName: 'Amina', lastName: 'El Khadraoui', phone: '0611122233', birthDate: '1996-01-20', address: '20 Avenue de la Plage, Tétouan', gender: 'female', bloodType: 'O+', photo: '', programId: programs[1]?.id, sessionsLeft: 5, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'inactive', fidelityPoints: 0, rfidCode: 'RFID010', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'amina.elkhadraoui@email.com', emergencyContactName: 'Mounir El Khadraoui', emergencyContactPhone: '0611122234', allergies: 'Lactose', weight: 60, height: 170, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Rachid', lastName: 'Alaoui', phone: '0622233344', birthDate: '1980-10-05', address: '14 Rue des Jardins, Kénitra', gender: 'male', bloodType: 'B+', photo: '', programId: programs[2]?.id, sessionsLeft: 1, programAmount: 180, amountPaid: 50, balanceDue: 130, discount: 0, advance: 0, subscriptionType: 'free_session', subscriptionDuration: '', status: 'active', fidelityPoints: 10, rfidCode: 'RFID011', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'rachid.alaoui@email.com', emergencyContactName: 'Zineb Alaoui', emergencyContactPhone: '0622233345', allergies: '', weight: 88, height: 176, fitnessGoal: 'Cardio', experienceLevel: 'débutant' },
    { firstName: 'Samira', lastName: 'Bennani', phone: '0633344455', birthDate: '1991-03-17', address: '9 Rue Al Qods, Safi', gender: 'female', bloodType: 'A+', photo: '', programId: programs[3]?.id, sessionsLeft: 18, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '12_mois', status: 'active', fidelityPoints: 300, rfidCode: 'RFID012', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'samira.bennani@email.com', emergencyContactName: 'Driss Bennani', emergencyContactPhone: '0633344456', allergies: 'Pénicilline', weight: 63, height: 166, fitnessGoal: 'Tonicité', experienceLevel: 'avancé' },
    { firstName: 'Mustapha', lastName: 'Hassani', phone: '0644455566', birthDate: '1983-08-29', address: '18 Rue de l\'Université, El Jadida', gender: 'male', bloodType: 'O+', photo: '', programId: programs[0]?.id, sessionsLeft: 7, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '2_mois', status: 'active', fidelityPoints: 75, rfidCode: 'RFID013', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'mustapha.hassani@email.com', emergencyContactName: 'Khadija Hassani', emergencyContactPhone: '0644455567', allergies: 'Sulfites', weight: 92, height: 188, fitnessGoal: 'Prise de masse', experienceLevel: 'intermédiaire' },
    { firstName: 'Nawal', lastName: 'Fikri', phone: '0655566677', birthDate: '1997-07-11', address: '22 Rue Essaada, Laâyoune', gender: 'female', bloodType: 'B+', photo: '', programId: programs[1]?.id, sessionsLeft: 3, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'expired', fidelityPoints: 25, rfidCode: 'RFID014', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'nawal.fikri@email.com', emergencyContactName: 'Ahmed Fikri', emergencyContactPhone: '0655566678', allergies: 'Gluten', weight: 57, height: 162, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Adil', lastName: 'Mouline', phone: '0666677788', birthDate: '1986-12-01', address: '11 Rue des Fleurs, Salé', gender: 'male', bloodType: 'AB+', photo: '', programId: programs[2]?.id, sessionsLeft: 9, programAmount: 180, amountPaid: 180, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 110, rfidCode: 'RFID015', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'adil.mouline@email.com', emergencyContactName: 'Souad Mouline', emergencyContactPhone: '0666677789', allergies: '', weight: 80, height: 179, fitnessGoal: 'Cardio', experienceLevel: 'intermédiaire' },
    { firstName: 'Imane', lastName: 'Kabbaj', phone: '0677788899', birthDate: '1994-04-22', address: '16 Rue Al Amal, Temara', gender: 'female', bloodType: 'O+', photo: '', programId: programs[3]?.id, sessionsLeft: 14, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 170, rfidCode: 'RFID016', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'imane.kabbaj@email.com', emergencyContactName: 'Youssef Kabbaj', emergencyContactPhone: '0677788890', allergies: 'Fruits de mer', weight: 64, height: 167, fitnessGoal: 'Tonicité', experienceLevel: 'intermédiaire' },
    { firstName: 'Driss', lastName: 'Chraibi', phone: '0688899900', birthDate: '1979-09-15', address: '19 Rue Al Inbiaat, Casablanca', gender: 'male', bloodType: 'A-', photo: '', programId: programs[0]?.id, sessionsLeft: 0, programAmount: 200, amountPaid: 0, balanceDue: 200, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '', status: 'inactive', fidelityPoints: 0, rfidCode: 'RFID017', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'driss.chraibi@email.com', emergencyContactName: 'Latifa Chraibi', emergencyContactPhone: '0688899901', allergies: 'Arachides', weight: 100, height: 190, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Meryem', lastName: 'Amrani', phone: '0699900011', birthDate: '1999-02-28', address: '3 Rue Al Manar, Fès', gender: 'female', bloodType: 'B-', photo: '', programId: programs[1]?.id, sessionsLeft: 11, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 95, rfidCode: 'RFID018', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'meryem.amrani@email.com', emergencyContactName: 'Ali Amrani', emergencyContactPhone: '0699900012', allergies: '', weight: 56, height: 164, fitnessGoal: 'Prise de masse', experienceLevel: 'débutant' },
    { firstName: 'Hicham', lastName: 'Bennouna', phone: '0610001111', birthDate: '1984-05-09', address: '25 Rue Al Qods, Rabat', gender: 'male', bloodType: 'AB-', photo: '', programId: programs[2]?.id, sessionsLeft: 16, programAmount: 180, amountPaid: 180, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 230, rfidCode: 'RFID019', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'hicham.bennouna@email.com', emergencyContactName: 'Nour Bennouna', emergencyContactPhone: '0610001112', allergies: 'Lactose', weight: 76, height: 177, fitnessGoal: 'Cardio', experienceLevel: 'avancé' },
    { firstName: 'Salma', lastName: 'Ouchen', phone: '0620002222', birthDate: '1990-10-31', address: '30 Rue Al Maghreb, Agadir', gender: 'female', bloodType: 'O+', photo: '', programId: programs[3]?.id, sessionsLeft: 22, programAmount: 220, amountPaid: 220, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '12_mois', status: 'active', fidelityPoints: 280, rfidCode: 'RFID020', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'salma.ouchen@email.com', emergencyContactName: 'Rachid Ouchen', emergencyContactPhone: '0620002223', allergies: 'Pénicilline', weight: 61, height: 169, fitnessGoal: 'Tonicité', experienceLevel: 'intermédiaire' },
    { firstName: 'Anas', lastName: 'Lamrani', phone: '0630003333', birthDate: '1995-06-19', address: '17 Rue Annour, Marrakech', gender: 'male', bloodType: 'B+', photo: '', programId: programs[0]?.id, sessionsLeft: 13, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '6_mois', status: 'active', fidelityPoints: 140, rfidCode: 'RFID021', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'anas.lamrani@email.com', emergencyContactName: 'Hind Lamrani', emergencyContactPhone: '0630003334', allergies: 'Oeufs', weight: 81, height: 181, fitnessGoal: 'Prise de masse', experienceLevel: 'intermédiaire' },
    { firstName: 'Asmaa', lastName: 'Regragui', phone: '0640004444', birthDate: '1989-08-07', address: '4 Rue Al Firdaous, Oujda', gender: 'female', bloodType: 'A+', photo: '', programId: programs[1]?.id, sessionsLeft: 0, programAmount: 250, amountPaid: 250, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '2_mois', status: 'expired', fidelityPoints: 40, rfidCode: 'RFID022', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'asmaa.regragui@email.com', emergencyContactName: 'Khalid Regragui', emergencyContactPhone: '0640004445', allergies: '', weight: 59, height: 165, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Yassine', lastName: 'Belkadi', phone: '0650005555', birthDate: '1981-01-14', address: '6 Rue Al Qods, Kénitra', gender: 'male', bloodType: 'O-', photo: '', programId: programs[2]?.id, sessionsLeft: 0, programAmount: 180, amountPaid: 180, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '1_mois', status: 'inactive', fidelityPoints: 20, rfidCode: 'RFID023', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'yassine.belkadi@email.com', emergencyContactName: 'Najat Belkadi', emergencyContactPhone: '0650005556', allergies: 'Sulfites', weight: 87, height: 183, fitnessGoal: 'Cardio', experienceLevel: 'intermédiaire' },
    { firstName: 'Khadija', lastName: 'Sadiki', phone: '0660006666', birthDate: '1992-11-25', address: '28 Rue Al Akhawayn, Ifrane', gender: 'female', bloodType: 'A+', photo: '', programId: programs[3]?.id, sessionsLeft: 10, programAmount: 220, amountPaid: 100, balanceDue: 120, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '3_mois', status: 'active', fidelityPoints: 50, rfidCode: 'RFID024', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', email: 'khadija.sadiki@email.com', emergencyContactName: 'Omar Sadiki', emergencyContactPhone: '0660006667', allergies: 'Gluten', weight: 66, height: 171, fitnessGoal: 'Perte de poids', experienceLevel: 'débutant' },
    { firstName: 'Mehdi', lastName: 'Boukhriss', phone: '0670007777', birthDate: '1993-03-03', address: '2 Rue Al Mouna, Tanger', gender: 'male', bloodType: 'B+', photo: '', programId: programs[0]?.id, sessionsLeft: 25, programAmount: 200, amountPaid: 200, balanceDue: 0, discount: 0, advance: 0, subscriptionType: 'subscription', subscriptionDuration: '12_mois', status: 'active', fidelityPoints: 350, rfidCode: 'RFID025', createdAt: new Date(), updatedAt: new Date(), syncStatus: 'synced', coachId: coaches[0]?.id, email: 'mehdi.boukhriss@email.com', emergencyContactName: 'Imane Boukhriss', emergencyContactPhone: '0670007778', allergies: '', weight: 84, height: 186, fitnessGoal: 'Prise de masse', experienceLevel: 'avancé' },
  ];

  const newMembers = allSample.filter(m => !existingPhones.has(m.phone));
  if (newMembers.length > 0) {
    await db.members.bulkAdd(newMembers);
    logger.info(`${newMembers.length} adhérents de test ajoutés`);
  }

  const allMembers = await db.members.toArray();
  const existingCheckins = await db.checkins.count();
  if (existingCheckins === 0 && allMembers.length > 0) {
    const now = new Date();
    const checkinsData: Omit<CheckIn, 'id'>[] = [];

    const member1 = allMembers.find(m => m.phone === '0678901234') || allMembers[0];
    const member2 = allMembers.find(m => m.phone === '0667890123') || allMembers[1];

    const dates1 = [
      new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      now,
    ];

    dates1.forEach((date) => {
      const checkinTime = new Date(date);
      checkinTime.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
      checkinsData.push({ memberId: member1.id!, timestamp: checkinTime, type: 'checkin' });
      const checkoutTime = new Date(date);
      checkoutTime.setHours(11 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      checkinsData.push({ memberId: member1.id!, timestamp: checkoutTime, type: 'checkout' });
    });

    const dates2 = [
      new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      now,
    ];

    dates2.forEach((date) => {
      const checkinTime = new Date(date);
      checkinTime.setHours(14 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60));
      checkinsData.push({ memberId: member2.id!, timestamp: checkinTime, type: 'checkin' });
      const checkoutTime = new Date(date);
      checkoutTime.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
      checkinsData.push({ memberId: member2.id!, timestamp: checkoutTime, type: 'checkout' });
    });

    await db.members.update(member1.id!, { coachId: 1 });
    await db.members.update(member2.id!, { coachId: 2 });
    await db.checkins.bulkAdd(checkinsData);
    logger.info(`${checkinsData.length} sessions de check-in simulées`);
  }
}

async function seedPayments() {
  const existingPayments = await db.payments.count();
  if (existingPayments > 0) return;

  const members = await db.members.toArray();
  if (members.length === 0) return;

  const now = new Date();
  const paymentsData: Omit<Payment, 'id'>[] = [];
  const planPrices: Record<string, number> = {
    'Musculation 1 mois': 4500, 'Musculation 3 mois': 12000, 'Musculation 6 mois': 21000, 'Musculation 12 mois': 35000,
    'CrossFit 1 mois': 5500, 'CrossFit 3 mois': 14500, 'Cours collectifs 1 mois': 4000, 'Cours collectifs 3 mois': 10500,
    'VIP Tout inclus 1 mois': 8000, 'VIP Tout inclus 12 mois': 65000, 'Séance unique': 500, 'Pack 10 séances': 4000,
  };

  const monthsBack = 6;
  for (let monthOffset = monthsBack; monthOffset >= 0; monthOffset--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);
    const numPaymentsThisMonth = 5 + Math.floor(Math.random() * 11);

    for (let i = 0; i < numPaymentsThisMonth; i++) {
      const member = members[Math.floor(Math.random() * members.length)];
      const paymentDate = new Date(monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime()));
      const isSubscription = Math.random() < 0.7;

      if (isSubscription) {
        const plans = Object.keys(planPrices);
        const plan = plans[Math.floor(Math.random() * plans.length)];
        paymentsData.push({ memberId: member.id!, amount: planPrices[plan], type: 'subscription', mode: Math.random() < 0.6 ? 'cash' : 'card', date: paymentDate, description: `Abonnement ${plan}`, createdAt: paymentDate });
      } else {
        const productAmounts = [30, 50, 80, 100, 120, 160, 200, 400, 500];
        paymentsData.push({ memberId: member.id!, amount: productAmounts[Math.floor(Math.random() * productAmounts.length)], type: 'product', mode: Math.random() < 0.7 ? 'cash' : 'card', date: paymentDate, description: 'Achat produits', createdAt: paymentDate });
      }
    }

    if (monthOffset % 2 === 0) {
      const member = members[Math.floor(Math.random() * members.length)];
      const paymentDate = new Date(monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime()));
      paymentsData.push({ memberId: member.id!, amount: 2000, type: 'coaching', mode: 'cash', date: paymentDate, description: 'Séance coaching privé', createdAt: paymentDate });
    }
  }

  for (let i = 0; i < 3; i++) {
    const member = members[Math.floor(Math.random() * members.length)];
    const paymentDate = new Date(now);
    paymentDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    const isSubscription = Math.random() < 0.5;
    if (isSubscription) {
      const plans = Object.keys(planPrices);
      const plan = plans[Math.floor(Math.random() * 4)];
      paymentsData.push({ memberId: member.id!, amount: planPrices[plan], type: 'subscription', mode: Math.random() < 0.6 ? 'cash' : 'card', date: paymentDate, description: `Abonnement ${plan}`, createdAt: paymentDate });
    } else {
      const productAmounts = [30, 50, 80, 100, 120, 160];
      paymentsData.push({ memberId: member.id!, amount: productAmounts[Math.floor(Math.random() * productAmounts.length)], type: 'product', mode: Math.random() < 0.7 ? 'cash' : 'card', date: paymentDate, description: 'Achat produits', createdAt: paymentDate });
    }
  }

  await db.payments.bulkAdd(paymentsData);
  logger.info(`${paymentsData.length} paiements simulés`);
}

async function seedExpenses() {
  const existingExpenses = await db.expenses.count();
  if (existingExpenses > 0) return;

  const now = new Date();
  const expensesData: Omit<Expense, 'id'>[] = [];
  const fixedExpenses = [
    { category: 'Loyer', amount: 150000, description: 'Loyer mensuel salle sport' },
    { category: 'Salaires', amount: 280000, description: 'Salaires coaches + réception' },
    { category: 'Électricité', amount: 35000, description: 'Facture électricité' },
    { category: 'Eau', amount: 8000, description: 'Facture eau' },
    { category: 'Assurance', amount: 12000, description: 'Assurance local' },
    { category: 'Taxes', amount: 15000, description: 'Taxes locales' },
  ];

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15);
    for (const exp of fixedExpenses) {
      const amountVariation = 0.9 + Math.random() * 0.2;
      expensesData.push({ category: exp.category, amount: Math.round(exp.amount * amountVariation), date: monthStart, description: exp.description, createdAt: monthStart });
    }

    const numVariable = 2 + Math.floor(Math.random() * 4);
    const variableCategories = ['Entretien', 'Marketing', 'Équipement', 'Autre'];
    for (let i = 0; i < numVariable; i++) {
      const category = variableCategories[Math.floor(Math.random() * variableCategories.length)];
      const amounts = category === 'Équipement' ? [15000, 25000, 40000, 50000] : [2000, 5000, 8000, 12000, 15000];
      const expenseDate = new Date(monthStart);
      expenseDate.setDate(5 + Math.floor(Math.random() * 20));
      expensesData.push({ category, amount: amounts[Math.floor(Math.random() * amounts.length)], date: expenseDate, description: `${category} - Maintenance/Approvisionnement`, createdAt: expenseDate });
    }
  }

  await db.expenses.bulkAdd(expensesData);
  logger.info(`${expensesData.length} dépenses simulées`);
}

export async function seedData() {
  await seedMembers();
  await seedPayments();
  await seedExpenses();
}
