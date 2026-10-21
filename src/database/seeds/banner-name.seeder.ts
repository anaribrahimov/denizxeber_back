import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { BannerName } from '../../banner-name/banner-name.entity.js';

export default class BannerNameSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager
  ): Promise<any> {
    const repository = dataSource.getRepository(BannerName);

    const hasData = await repository.count();

    if (hasData) {
      console.log('Ignored BannerNameSeeder because there is data in the table');
      return;
    }

    await repository.save(
      [
        'Header top',
        'Header bottom',
        'In-List',
        'Sidebar-1',
        'Sidebar-2',
        'Sidebar-3',
        'Sidebar-4',
        'Sidebar-5',
        'Article top',
        'Article bottom',
      ]
        .map((name, i) => ({
          id: i + 1,
          name,
        }))
    );
  }
}
