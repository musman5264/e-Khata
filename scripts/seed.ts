import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { UsersService } from '../src/modules/users/users.service';
import { LedgerService } from '../src/modules/ledger/ledger.service';
import { TransactionsService } from '../src/modules/transactions/transactions.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  console.log('🌱 Seeding database...\n');

  const app = await NestFactory.create(AppModule);
  
  const tenantsService = app.get(TenantsService);
  const usersService = app.get(UsersService);
  const ledgerService = app.get(LedgerService);
  const transactionsService = app.get(TransactionsService);

  try {
    // Create a demo tenant
    console.log('📊 Creating demo tenant...');
    const tenant = await tenantsService.create({
      name: 'Demo Business',
      businessName: 'Demo Business Pvt Ltd',
      address: '123 Main Street, Gujranwala',
      contactNumber: '03001234567',
      email: 'demo@example.com',
    });
    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})\n`);

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await usersService.create({
      mobileNumber: '03001234567',
      password: hashedPassword,
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'admin' as any,
      tenantId: tenant.id,
    });
    console.log(`✅ Admin user created: ${adminUser.mobileNumber}\n`);

    // Create regular user
    console.log('👤 Creating regular user...');
    const regularUser = await usersService.create({
      mobileNumber: '03009876543',
      password: await bcrypt.hash('user123', 10),
      fullName: 'Regular User',
      email: 'user@example.com',
      role: 'user' as any,
      tenantId: tenant.id,
    });
    console.log(`✅ Regular user created: ${regularUser.mobileNumber}\n`);

    // Create sample ledgers
    console.log('📒 Creating sample ledgers...');
    const ledger1 = await ledgerService.create({
      customerName: 'Ali Ahmed',
      customerMobile: '03111111111',
      customerEmail: 'ali@example.com',
      address: '456 Street, Lahore',
    }, tenant.id);
    console.log(`✅ Ledger created: ${ledger1.customerName}`);

    const ledger2 = await ledgerService.create({
      customerName: 'Sara Khan',
      customerMobile: '03222222222',
      customerEmail: 'sara@example.com',
      address: '789 Avenue, Karachi',
    }, tenant.id);
    console.log(`✅ Ledger created: ${ledger2.customerName}\n`);

    // Create sample transactions
    console.log('💰 Creating sample transactions...');
    
    // Debit transaction (customer owes)
    await transactionsService.create({
      type: 'debit' as any,
      amount: 5000,
      description: 'Purchase of goods',
      reference: 'INV-001',
      ledgerId: ledger1.id,
    }, tenant.id);
    console.log(`✅ Transaction: Debit Rs. 5000 for ${ledger1.customerName}`);

    // Credit transaction (customer paid)
    await transactionsService.create({
      type: 'credit' as any,
      amount: 2000,
      description: 'Payment received',
      reference: 'PAY-001',
      ledgerId: ledger1.id,
    }, tenant.id);
    console.log(`✅ Transaction: Credit Rs. 2000 for ${ledger1.customerName}`);

    // More transactions for second ledger
    await transactionsService.create({
      type: 'debit' as any,
      amount: 10000,
      description: 'Bulk purchase',
      reference: 'INV-002',
      ledgerId: ledger2.id,
    }, tenant.id);
    console.log(`✅ Transaction: Debit Rs. 10000 for ${ledger2.customerName}\n`);

    console.log('✨ Database seeded successfully!\n');
    console.log('📝 Login credentials:');
    console.log('   Admin - Mobile: 03001234567, Password: admin123');
    console.log('   User  - Mobile: 03009876543, Password: user123\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Demo data already exists. Please clear the database first.\n');
    }
  } finally {
    await app.close();
  }
}

bootstrap();
