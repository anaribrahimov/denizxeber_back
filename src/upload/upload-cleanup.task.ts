import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { UploadService } from "./upload.service.js";

@Injectable()
export class UploadCleanupTask {
  private readonly logger = new Logger(UploadCleanupTask.name);

  constructor(
    private readonly uploadService: UploadService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    waitForCompletion: true,
  })
  async handleCleanup() {
    try {
      const deletedCount = await this.uploadService.purgeDeleteds();
      this.logger.log(`Purged deleted uploads. Purged ${deletedCount}`);
    } catch (err) {
      this.logger.error(err);
    }
  }
}
