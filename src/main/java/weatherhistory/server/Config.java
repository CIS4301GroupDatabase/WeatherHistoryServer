package weatherhistory.server;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.net.URLDecoder;

public class Config 
{

	private String name = "";
	private String password = "";
	private String databaseAddress = "jdbc:oracle:thin:hr/hr@oracle.cise.ufl.edu:1521:orcl";
	private boolean createdNew = false;
	
	public Config() throws IOException
	{
		String configLocation = Main.class.getProtectionDomain().getCodeSource().getLocation().getPath();
		configLocation = URLDecoder.decode(configLocation, "UTF-8");
		configLocation = (new File(configLocation)).getParentFile().getPath();
		configLocation += "\\weatherhistory-config.txt";
		File configFile = new File(configLocation);
		if (configFile.exists())
		{
			getConfig(configFile);
		}
		else
		{
			System.out.println("Creating config at " + configLocation);
			createConfig(configFile);
			createdNew = true;
		}
	}
	
	public boolean getCreatedNew()
	{
		return createdNew;
	}
	
	public String getName()
	{
		return name;
	}
	
	public String getPassword()
	{
		return password;
	}
	
	public String getDatabaseURL()
	{
		return databaseAddress;
	}
	
	private void getConfig(File configFile)
	{
		// Load the config file
		try (BufferedReader reader = new BufferedReader(new FileReader(configFile)))
		{
			String line = "";
			while ((line = reader.readLine()) != null)
			{
				if (line.contains("DatabaseURL="))
				{
					this.databaseAddress = line.replace("DatabaseURL=", "");
				}
				else if (line.contains("Name="))
				{
					this.name = line.replace("Name=", "");
				}
				else if (line.contains("Password="))
				{
					this.password = line.replace("Password=", "");
				}
			}
			reader.close();
		}
		catch (FileNotFoundException e)
		{
			e.printStackTrace();
		}
		catch (IOException e)
		{
			e.printStackTrace();
		}
	}
	
	private void createConfig(File configFile) throws IOException
	{
		configFile.createNewFile();
		FileOutputStream stream = new FileOutputStream(configFile);
		BufferedWriter out = new BufferedWriter(new OutputStreamWriter(stream));
		out.write("DatabaseURL=" + getDatabaseURL());
		out.newLine();
		out.write("Name=" + getName());
		out.newLine();
		out.write("Password=" + getPassword());
		out.close();
	}
}
