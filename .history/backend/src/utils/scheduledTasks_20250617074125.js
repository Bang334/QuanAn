const cron = require('node-cron');
const { User, Salary } = require('../models');
const salaryController = require('../controllers/salary.controller');
const dayjs = require('dayjs');

/**
 * Scheduled task to automatically generate salary records on the first day of each month
 */
const scheduleSalaryGeneration = () => {
  // Run at 00:01 on the 1st day of each month
  cron.schedule('1 0 1 * *', async () => {
    try {
      
      const currentDate = dayjs();
      const month = currentDate.month() + 1;
      const year = currentDate.year();
      
      await generateSalariesForMonth(month, year);
    } catch (error) {
      console.error('Error in automatic salary generation task:', error);
    }
  });
};


const generateSalariesForMonth = async (month, year) => {
  try {
    const staffUsers = await User.findAll({
      where: {
        role: ['waiter', 'kitchen']
      }
    });

    let successCount = 0;
    
    for (const user of staffUsers) {
      try {
        const existingSalary = await Salary.findOne({
          where: {
            userId: user.id,
            month,
            year
          },
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email', 'role']
            }
          ]
        });
        
        if (!existingSalary) {
          // Create new salary record
          const salary = await Salary.create({
            userId: user.id,
            month,
            year,
            totalHours: 0,
            totalHourlyPay: 0,
            bonus: 0,
            deduction: 0,
            workingDays: 0,
            status: 'pending'
          });
          
          // Lấy thông tin user để đính kèm vào salary
          const userWithDetails = await User.findByPk(user.id);
          salary.User = userWithDetails;
          
          // Calculate hourly pay based on attendance records
          await salaryController.calculateHourlyPayForSalary(salary);
          successCount++;
        } else {
          // Tính lại lương nếu đã tồn tại
          await salaryController.calculateHourlyPayForSalary(existingSalary);
        }
      } catch (error) {
        console.error(`Error generating salary for user ${user.id}:`, error);
      }
    }
    
    // console.log(`Successfully generated ${successCount} salary records for ${month}/${year}`);
    return successCount;
  } catch (error) {
    console.error('Error generating salaries:', error);
    throw error;
  }
};

/**
 * Generate salary records for the current month (for testing)
 */
const generateSalariesForCurrentMonth = async () => {
  const currentDate = dayjs();
  const month = currentDate.month() + 1;
  const year = currentDate.year();
  
  return await generateSalariesForMonth(month, year);
};

module.exports = {
  scheduleSalaryGeneration,
  generateSalariesForMonth,
  generateSalariesForCurrentMonth
}; 