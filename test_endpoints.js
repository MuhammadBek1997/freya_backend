const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testSalon = {
    salon_name: "Test Salon",
    salon_phone: "+998901234567",
    salon_add_phone: "+998901234568",
    salon_instagram: "@testsalon",
    salon_rating: 4.5,
    comments: [],
    salon_payment: { cash: true, card: true },
    salon_description: "Test salon description",
    salon_types: ["hair", "nails"],
    private_salon: false,
    work_schedule: [
        { day: "Monday", start: "09:00", end: "18:00" }
    ],
    salon_title: "Professional Beauty Salon",
    salon_additionals: ["wifi", "parking"],
    sale_percent: 10,
    sale_limit: 1000,
    location: { lat: 41.2995, lng: 69.2401 },
    salon_orient: { address: "Tashkent, Uzbekistan" },
    salon_photos: ["photo1.jpg", "photo2.jpg"],
    salon_comfort: ["air_conditioning", "music"]
};

const testEmployee = {
    employee_name: "Test Employee",
    employee_phone: "+998901234569",
    employee_password: "password123",
    employee_instagram: "@testemployee",
    employee_rating: 4.8,
    employee_description: "Experienced stylist",
    employee_photos: ["emp1.jpg"],
    employee_services: ["haircut", "styling"],
    employee_work_schedule: [
        { day: "Monday", start: "09:00", end: "18:00" }
    ],
    salon_id: null // Will be set after salon creation
};

async function testEndpoints() {
    console.log('🚀 Starting API endpoint tests...\n');
    
    let superadminToken = null;
    let salonId = null;
    let employeeId = null;

    try {
        // Test 1: Superadmin Login
        console.log('1️⃣ Testing Superadmin Login...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/superadmin/login`, {
                username: 'superadmin',
                password: 'admin123'
            });
            
            if (loginResponse.data.success) {
                superadminToken = loginResponse.data.token;
                console.log('✅ Superadmin login successful');
                console.log('Token:', superadminToken.substring(0, 50) + '...');
            }
        } catch (error) {
            console.log('❌ Superadmin login failed:', error.response?.data?.message || error.message);
        }

        // Test 2: Get All Salons
        console.log('\n2️⃣ Testing Get All Salons...');
        try {
            const salonsResponse = await axios.get(`${BASE_URL}/salons`);
            console.log('✅ Get salons successful');
            console.log('Salons count:', salonsResponse.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Get salons failed:', error.response?.data?.message || error.message);
        }

        // Test 3: Create Salon (requires superadmin token)
        if (superadminToken) {
            console.log('\n3️⃣ Testing Create Salon...');
            try {
                const createSalonResponse = await axios.post(`${BASE_URL}/salons`, testSalon, {
                    headers: { Authorization: `Bearer ${superadminToken}` }
                });
                
                if (createSalonResponse.data.success) {
                    salonId = createSalonResponse.data.salon.id;
                    console.log('✅ Salon created successfully');
                    console.log('Salon ID:', salonId);
                }
            } catch (error) {
                console.log('❌ Create salon failed:', error.response?.data?.message || error.message);
            }
        }

        // Test 4: Get Salon by ID
        if (salonId) {
            console.log('\n4️⃣ Testing Get Salon by ID...');
            try {
                const salonResponse = await axios.get(`${BASE_URL}/salons/${salonId}`);
                console.log('✅ Get salon by ID successful');
                console.log('Salon name:', salonResponse.data.salon?.salon_name);
            } catch (error) {
                console.log('❌ Get salon by ID failed:', error.response?.data?.message || error.message);
            }
        }

        // Test 5: Create Employee
        if (superadminToken && salonId) {
            console.log('\n5️⃣ Testing Create Employee...');
            testEmployee.salon_id = salonId;
            try {
                const createEmployeeResponse = await axios.post(`${BASE_URL}/employees`, testEmployee, {
                    headers: { Authorization: `Bearer ${superadminToken}` }
                });
                
                if (createEmployeeResponse.data.success) {
                    employeeId = createEmployeeResponse.data.employee.id;
                    console.log('✅ Employee created successfully');
                    console.log('Employee ID:', employeeId);
                }
            } catch (error) {
                console.log('❌ Create employee failed:', error.response?.data?.message || error.message);
            }
        }

        // Test 6: Get All Employees
        console.log('\n6️⃣ Testing Get All Employees...');
        try {
            const employeesResponse = await axios.get(`${BASE_URL}/employees/list`);
            console.log('✅ Get employees successful');
            console.log('Employees count:', employeesResponse.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Get employees failed:', error.response?.data?.message || error.message);
        }

        // Test 7: Employee Login
        console.log('\n7️⃣ Testing Employee Login...');
        try {
            const empLoginResponse = await axios.post(`${BASE_URL}/auth/employee/login`, {
                username: 'testemployee',
                password: 'password123'
            });
            
            if (empLoginResponse.data.success) {
                console.log('✅ Employee login successful');
                console.log('Employee token:', empLoginResponse.data.token.substring(0, 50) + '...');
            }
        } catch (error) {
            console.log('❌ Employee login failed:', error.response?.data?.message || error.message);
        }

        // Test 8: Get Schedules
        console.log('\n8️⃣ Testing Get Schedules...');
        try {
            const schedulesResponse = await axios.get(`${BASE_URL}/schedules`);
            console.log('✅ Get schedules successful');
            console.log('Schedules count:', schedulesResponse.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Get schedules failed:', error.response?.data?.message || error.message);
        }

        // Test 9: Get Users
        console.log('\n9️⃣ Testing Get Users...');
        try {
            const usersResponse = await axios.get(`${BASE_URL}/users`);
            console.log('✅ Get users successful');
            console.log('Users count:', usersResponse.data.data?.length || 0);
        } catch (error) {
            console.log('❌ Get users failed:', error.response?.data?.message || error.message);
        }

        // Test 10: Swagger Documentation
        console.log('\n🔟 Testing Swagger Documentation...');
        try {
            const swaggerResponse = await axios.get('http://localhost:5000/api-docs/');
            console.log('✅ Swagger documentation accessible');
            console.log('Response length:', swaggerResponse.data.length);
        } catch (error) {
            console.log('❌ Swagger documentation failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }

    console.log('\n🏁 API endpoint tests completed!');
}

// Run tests
testEndpoints();