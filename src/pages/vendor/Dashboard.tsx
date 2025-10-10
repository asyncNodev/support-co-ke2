          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Configure your quotation preferences and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">RFQ Acceptance Preference</h3>
                    <div className="space-y-4">
                      <fieldset className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            id="accept-all"
                            name="rfq-acceptance"
                            type="radio"
                            value="all"
                            checked={currentUser?.rfqAcceptancePreference === "all"}
                            onChange={async () => {
                              await updateQuotationPreference({ rfqAcceptancePreference: "all" });
                            }}
                            className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          />
                          <Label htmlFor="accept-all" className="cursor-pointer">
                            Accept quotations for all products
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            id="accept-selected"
                            name="rfq-acceptance"
                            type="radio"
                            value="selected"
                            checked={currentUser?.rfqAcceptancePreference === "selected"}
                            onChange={async () => {
                              await updateQuotationPreference({ rfqAcceptancePreference: "selected" });
                            }}
                            className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          />
                          <Label htmlFor="accept-selected" className="cursor-pointer">
                            Accept quotations only for selected products
                          </Label>
                        </div>
                      </fieldset>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Quotation Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Default Payment Terms</Label>
                        <Select value={paymentTerms} onValueChange={(v: "cash" | "credit") => setPaymentTerms(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Default Delivery Time</Label>
                        <Input
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
                          placeholder="3-5 days"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Warranty Period</Label>
                        <Input
                          value={warrantyPeriod}
                          onChange={(e) => setWarrantyPeriod(e.target.value)}
                          placeholder="12 months"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Receive RFQ Notifications</Label>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Receive Quotation Updates</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>